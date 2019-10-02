import { Readable } from "stream";

import { Collection, Snowflake, StreamDispatcher, VoiceChannel, VoiceConnection } from "discord.js";

import { MessageChannel } from "./util";

/* tslint:disable:no-console */

export interface IAudioTrack
{
    title:    string;
    url:      string;
    length:   number;
    id:       string;
    loudness: number;

    getStream(): Readable;
}
type TrackRequest = { track: IAudioTrack, vox_channel: VoiceChannel, msg_channel: MessageChannel };
export class AudioStream
{
    public constructor(
        public track:      IAudioTrack,
        public stream:     Readable,
        public connection: VoiceConnection,
        public channel:    MessageChannel
    ) {  }
}

export class AudioState
{
    private queue:    TrackRequest[] = [  ];
    private current?: AudioStream;
    private dispatcher?: StreamDispatcher;
    private block: boolean = false;

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
        if(!this.dispatcher) { return; }
        this.dispatcher.end();
    }
    public stopPlayback()
    {
        this.queue = [  ];
        this.nextStream();
    }

    public async nextStream()
    {
        console.log("Starting next stream...");
        this.block = true;
        if(this.queue.length === 0) {
            console.log("Audio queue empty :(");
            if(this.current) {
                this.current.connection.disconnect();
                delete this.current;
                delete this.dispatcher;
            }
            this.block = false;
            return;
        }

        const next = this.queue.shift() as TrackRequest;
        if(this.current && this.current.connection.channel.id !== next.vox_channel.id) {
            console.log("Switching audio channels!");
            this.current.connection.disconnect();
        }
        const new_connection = (this.current && this.current.connection.channel.id === next.vox_channel.id)
            ? this.current.connection
            : await next.vox_channel.join();

        console.log("Got connection!");
        this.current = new AudioStream(next.track, next.track.getStream(), new_connection, next.msg_channel);
        setTimeout(() => {
            this.block = false;
            console.log("Starting playback...");
            this.startPlayback();
        }, 0);
    }



    private startPlayback()
    {
        if(!this.current) { return; }
        const current = this.current;

        this.dispatcher = current.connection.playStream(current.stream, { volume: current.track.loudness || 0.2 })
            .once("start", () => { current.channel.send(`Now Streaming: ${current.track.title}`); })
            .once("end", () => { this.nextStream(); })
            .on("error", (err) => {
                current.channel.send(`There was an error streaming to ${current.connection.channel.name}`);
                console.log(`There was an error streaming to ${current.connection.channel.name}`, { queue: this.queue });
                console.log(err);
                current.connection.disconnect();
            })
            .on("disconnect", () => {
                current.stream.destroy();
                this.queue = [  ];
                console.log("YouTube read disconnect event, flushed queue.");
            });
    }
}
export class AudioController
{
    private connections: Collection<Snowflake, AudioState> = new Collection();

    public getQueue(gid: Snowflake)
    {
        if(this.connections.has(gid)) {
            return (this.connections.get(gid) as AudioState).stringifyQueue();
        } else {
            return "There is no active audio state for your guild. Queue some songs!";
        }
    }
    public queueTrack(track: IAudioTrack, vox_channel: VoiceChannel, msg_channel: MessageChannel)
    {
        const gid = vox_channel.guild.id;
        if(!this.connections.has(gid)) {
            this.connections.set(gid, new AudioState());
        }
        (this.connections.get(gid) as AudioState).queueTrack({ track, vox_channel, msg_channel });
    }
    public skipPlayback(gid: Snowflake)
    {
        if(this.connections.has(gid)) {
            (this.connections.get(gid) as AudioState).skipPlayback();
        } else {
            return "There is no active audio state for your guild. Queue some songs!";
        }
    }
    public stopPlayback(gid: Snowflake)
    {
        if(this.connections.has(gid)) {
            (this.connections.get(gid) as AudioState).stopPlayback();
        } else {
            return "There is no active audio state for your guild. Queue some songs!";
        }
    }
}

export const AUDIO_CONTROLLER = new AudioController();
