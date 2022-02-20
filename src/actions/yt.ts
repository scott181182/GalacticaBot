import { StreamType } from "@discordjs/voice";
import { IAction } from "botiful";
import { TextChannel, VoiceChannel } from "discord.js";
import ytdl from "ytdl-core";

import { AUDIO_CONTROLLER, IAudioTrack } from "../audio";
import { createAudioResourceFromStream } from "../util";



// Improvements
// * Start time for videos
// * loudness fix to allow bot to be resonable played at 100% in discord
// * Playlist functionality

export class YouTubeTrack implements IAudioTrack
{
    public constructor(
        public title:    string,
        public url:      string,
        public length:   number,
        public id:       string,
        public loudness: number
    ) {  }

    public getResource()
    {
        console.log(`Getting stream from ${this.url}`);
        const stream = ytdl(this.url, {
            /* quality: 'highestaudio', */
            filter: "audioonly",
            highWaterMark: 1 << 25
        });
        return createAudioResourceFromStream(stream, StreamType.WebmOpus);
    }
}


export const ytCommand: IAction = {
    name: 'yt',
    description: 'Play and control YouTube audio on a voice channel',
    admin: false,
    man: '!yt <url>',
    run: (args, msg, bot) => {
        if (args[0])
        {
            const voxChannelId = msg.member?.voice.channelId;
            if(!voxChannelId) {
                msg.channel.send("You must be in a voice channel to queue a YouTube video!");
                return;
            }
            const yt_url = get_youtube_url(args[0]);
            return ytdl.getInfo(yt_url)
                .catch(err => {
                    bot.log.error(err);
                    return Promise.reject(`Could not access the YouTube video at '${yt_url}'!`);
                })
                .then(async (metadata) => {
                    let loudness = 0.2;
                    let background = false;
                    if(args[1]) {
                        if(args[1] === "background") { background = true; }
                        else {
                            loudness = parseFloat(args[1]);
                            background = args[2] === "background";
                        }
                    }

                    const track = new YouTubeTrack(
                        metadata.videoDetails.title,
                        yt_url,
                        parseInt(metadata.videoDetails.lengthSeconds, 10),
                        metadata.videoDetails.videoId,
                        loudness);
                    bot.log.debug(`Queueing YouTube URL '${yt_url}' with loudness ${loudness}`);
                    if(!msg.member?.voice.channel) {
                        msg.channel.send("You must be in a voice channel to queue a YouTube video!");
                        return;
                    }
                    const voxChannel = msg.guild?.channels.cache.get(voxChannelId);
                    if(!voxChannel) {
                        msg.channel.send("Error: Could not find voice channel of original request.");
                        return;
                    }

                    AUDIO_CONTROLLER.queueTrack(
                        track,
                        voxChannel as VoiceChannel,
                        msg.channel as TextChannel,
                        { background }
                    );
                })
                .catch(err => {
                    bot.log.error(err);
                    return Promise.reject("There was an error playing back the YouTube stream :(");
                })
                .catch((err: string) => { msg.channel.send(err); });
        } else {
            msg.channel.send('You need to provided a url. Example: \`!yt wuJIqmha2Hk\`');
        }
    }
};



function get_youtube_url(url: string)
{
    if(/^[0-9a-zA-Z_\-]+$/.test(url)) { return "https://www.youtube.com/watch?v=" + url; }
    return url;
}
