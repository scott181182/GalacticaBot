import { IAction } from "botiful";

import * as ytdl from "ytdl-core";

import { Readable } from "stream";

import { AUDIO_CONTROLLER, IAudioTrack } from "../audio";

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

    public getStream()
    {
        return ytdl(this.url, { quality: 'highestaudio', filter: 'audioonly' });
    }
}


export const yt: IAction = {
    name: 'yt',
    description: 'Play and control YouTube audio on a voice channel',
    admin: false,
    man: '!yt <url>',
    run: (args, msg, bot) => {
        if (args[0])
        {
            if(!msg.member.voiceChannel) {
                msg.channel.send("You must be in a voice channel to queue a YouTube video!");
                return;
            }
            const yt_url = get_youtube_url(args[0]);
            return ytdl.getInfo(yt_url)
                .catch(err => {
                    bot.log.error(err);
                    throw `Could not access the YouTube video at '${yt_url}'!`;
                })
                .then(async (metadata) => {
                    const track = new YouTubeTrack(
                        metadata.title,
                        metadata.video_url,
                        parseInt(metadata.length_seconds, 10),
                        metadata.video_id,
                        parseFloat(metadata.loudness));
                    // bot.log.debug(`${track.title} added to queue with loudness ${track.loudness}.`);
                    bot.log.debug(`Queueing YouTube URL '${yt_url}'`);
                    AUDIO_CONTROLLER.queueTrack(track, msg.member.voiceChannel, msg.channel);
                })
                .catch(err => {
                    bot.log.error(err);
                    throw "There was an error playing back the YouTube stream :(";
                })
                .catch((err: string) => { msg.channel.send(err); });
        } else {
            msg.channel.send('You need to provided a url. Example: \`!yt wuJIqmha2Hk\`');
        }
    }
};



function get_youtube_url(url: string)
{
    if(/[0-9a-z_\-]+/.test(url)) { return "https://www.youtube.com/watch?v=" + url; }
    return url;
}
