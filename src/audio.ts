import { Readable } from "stream";

import { Collection, Guild, Snowflake, VoiceChannel } from "discord.js";
import { createAudioPlayer, createAudioResource, joinVoiceChannel, VoiceConnection, PlayerSubscription, AudioResource, VoiceConnectionStatus, AudioPlayerStatus } from "@discordjs/voice";

import { AudioResourceWithVolume, MessageChannel } from "./util";

/* tslint:disable:no-console */

export interface IAudioTrack
{
    title:    string;
    url:      string;
    length:   number;
    id:       string;
    loudness: number;

    getResource(): AudioResourceWithVolume;
}
interface TrackRequest {
    track: IAudioTrack;
    voxChannel: VoiceChannel;
    msgChannel: MessageChannel;
}
export class AudioStream
{
    public constructor(
        public track:      IAudioTrack,
        public resource:   AudioResourceWithVolume,
        public voxChannel: VoiceChannel,
        public msgChannel: MessageChannel
    ) {  }
}

export class GuildAudioConnection
{
    private queue:    TrackRequest[] = [  ];
    private current?: AudioStream;
    private connection?: VoiceConnection;
    private player = createAudioPlayer();
    private subscription?: PlayerSubscription;
    private block: boolean = false;

    public constructor(public readonly guild: Guild) {
        this.player = createAudioPlayer();

        this.player.on("stateChange", (oldState, newState) => {
            console.log(`[audio-state] ${oldState.status} -> ${newState.status}`)
            if(newState.status === AudioPlayerStatus.Playing) {
                if(this.current) {
                    this.current.msgChannel.send(`Now Streaming: ${this.current.track.title}`);
                } else {
                    console.error(`AudioPlayer(${this.guild.id}) now playing, but no current stream!`);
                }
            } else if(newState.status === AudioPlayerStatus.Idle) {
                this.nextStream();
            }
        });
        this.player.on("error", (err) => {
            this.disconnect();
            console.log(err);
            if(this.current) {
                this.current.msgChannel.send(`There was an error streaming to ${this.current.voxChannel.name}`);
                console.log(`There was an error streaming to ${this.current.voxChannel.name}`, { queue: this.queue });
            } else {
                console.log("There was an error streaming to a non-current audio channel", { queue: this.queue });
            }
        });
    }

    public stringifyQueue()
    {
        if(!this.current && this.queue.length === 0) { return "The queue is currently empty."; }
        let ret = "*** Tracks Queued ***\n";

        if(this.current)
        {
            const length = new Date(this.current.track.length * 1000).toISOString().substr(11, 8);
            ret += `Playing - ${this.current.track.title}\t [${length}]\n`;
        }
        for(let i = 0; i < this.queue.length && i < 14; i++)
        {
            const length = new Date(this.queue[i].track.length * 1000).toISOString().substr(11, 8);
            ret += `#${i+1} - ${this.queue[i].track.title}\t [${length}]\n`;
        }
        return ret;
    }
    public queueTrack(request: TrackRequest)
    {
        this.queue.push(request);
        if(!this.current && !this.block) { this.nextStream(); }
    }
    public skipPlayback()
    {
        if(!this.current) { return; }
        this.player.stop();
    }
    public pausePlayback()  { this.player.pause();   }
    public resumePlayback() { this.player.unpause(); }
    public stopPlayback()
    {
        this.queue = [  ];
        this.nextStream();
    }

    public setVolume(volume: number) {
        if(!this.current) { return; }
        this.current.resource.volume.setVolume(volume);
    }

    public async nextStream()
    {
        console.log("Starting next stream...");
        this.block = true;
        if(this.queue.length === 0) {
            console.log("Audio queue empty :(");
            if(this.current) {
                delete this.current;
                this.subscription?.unsubscribe();
                delete this.subscription;
                this.disconnect();
            }
            this.block = false;
            return;
        }

        const next = this.queue.shift() as TrackRequest;
        this.connect(next.voxChannel.id);

        this.current = new AudioStream(next.track, next.track.getResource(), next.voxChannel, next.msgChannel);
        setTimeout(() => {
            this.block = false;
            this.startPlayback();
        }, 0);
    }



    private startPlayback()
    {
        if(!this.current || !this.connection) { return; }
        const current = this.current;

        current.resource.volume.setVolume(current.track.loudness || 0.2);
        this.player.play(current.resource);
    }
    private connect(channelId: string) {
        if(!this.connection) {
            this.connection = joinVoiceChannel({
                guildId: this.guild.id,
                channelId,
                adapterCreator: this.guild.voiceAdapterCreator,
                selfDeaf: true,
                selfMute: false
            });

            this.connection?.on("stateChange", (_oldState, newState) => {
                if(newState.status === VoiceConnectionStatus.Disconnected) {
                    this.player.stop();
                    this.queue = [  ];
                    console.log("AudioConnection disconnect event, flushed queue.");
                }
            });
        } else if(this.connection.state.status === VoiceConnectionStatus.Disconnected) {
            console.log("Rejoining audio channel!");
            this.connection.rejoin({
                channelId,
                selfDeaf: true,
                selfMute: false
            });
        } else if(this.current && this.current.voxChannel.id !== channelId) {
            console.log("Switching audio channels!");
            this.disconnect();
            this.connection.rejoin({
                channelId,
                selfDeaf: true,
                selfMute: false
            });
        }
        if(!this.subscription) {
            this.subscription = this.connection.subscribe(this.player);
        }
    }
    private disconnect() {
        if(this.connection && this.connection.state.status === VoiceConnectionStatus.Ready) {
            this.connection.disconnect();
        }
    }
}

export class AudioController
{
    private connections: Collection<Snowflake, GuildAudioConnection> = new Collection();

    public getQueue(gid: Snowflake)
    {
        if(this.connections.has(gid)) {
            return (this.connections.get(gid) as GuildAudioConnection).stringifyQueue();
        } else {
            return "There is no active audio state for your guild. Queue some songs!";
        }
    }
    public queueTrack(track: IAudioTrack, vox_channel: VoiceChannel, msg_channel: MessageChannel)
    {
        const gid = vox_channel.guild.id;
        if(!this.connections.has(gid)) {
            this.connections.set(gid, new GuildAudioConnection(vox_channel.guild));
        }
        (this.connections.get(gid) as GuildAudioConnection).queueTrack({ track, voxChannel: vox_channel, msgChannel: msg_channel });
    }
    public skipPlayback(gid: Snowflake)
    {
        if(this.connections.has(gid)) {
            (this.connections.get(gid) as GuildAudioConnection).skipPlayback();
        } else {
            return "There is no active audio state for your guild. Queue some songs!";
        }
    }
    public pausePlayback(gid: Snowflake) {
        try { this.getGuildConnection(gid).pausePlayback(); }
        catch(err) { return "There is no active audio state for your guild. Queue some songs!"; }
    }
    public resumePlayback(gid: Snowflake) {
        try { this.getGuildConnection(gid).resumePlayback(); }
        catch(err) { return "There is no active audio state for your guild. Queue some songs!"; }
    }
    public stopPlayback(gid: Snowflake) {
        try { this.getGuildConnection(gid).stopPlayback(); }
        catch(err) { return "There is no active audio state for your guild. Queue some songs!"; }
    }

    public setVolume(gid: Snowflake, volume: number) {
        try { this.getGuildConnection(gid).setVolume(volume); }
        catch(err) { return "There is no active audio state for your guild. Queue some songs!"; }
    }



    private getGuildConnection(gid: Snowflake) {
        if(this.connections.has(gid)) {
            return this.connections.get(gid) as GuildAudioConnection;
        } else {
            throw new Error(`Could not find GuildAudioConnection for guild '${gid}'`);
        }
    }
}

export const AUDIO_CONTROLLER = new AudioController();
