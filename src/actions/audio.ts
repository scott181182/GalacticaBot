import { IAction } from "botiful";

import { AUDIO_CONTROLLER } from "../audio";



export const audioCommand: IAction = {
    name: 'audio',
    description: 'Control playback of audio in voice channels',
    admin: false,
    man: '!audio [next|skip|queue|stop]',
    run: (args, msg, _bot) => {
        if(!msg.guildId) {
            msg.channel.send("Error: cannot identify guild");
            return;
        }
        switch (args[0])
        {
            case "skip":
            case "next":
                return AUDIO_CONTROLLER.skipPlayback(msg.guildId);
            case "queue":
                return AUDIO_CONTROLLER.getQueue(msg.guildId);
            case "pause":
                return AUDIO_CONTROLLER.pausePlayback(msg.guildId);
            case "play":
            case "resume":
                return AUDIO_CONTROLLER.resumePlayback(msg.guildId);
            case "stop":
                return AUDIO_CONTROLLER.stopPlayback(msg.guildId);
            case "volume":
                if(!args[1]) { return "Please pass a volume between 0 and 1."; }
                let volume;
                try { volume = parseFloat(args[1]) }
                catch(err) { return "Failed to parse the given volume"; }
                if(!Number.isFinite(volume)) { return `Bad volume value: ${volume}`; }
                if(volume < 0 || volume > 1) { return "Please give a volume between 0 and 1 (inclusive)"; }
                return AUDIO_CONTROLLER.setVolume(msg.guildId, volume);
        }
    }
};
