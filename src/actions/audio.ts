import { IAction } from "botiful";

import { AUDIO_CONTROLLER } from "../audio";



export const audio: IAction = {
    name: 'audio',
    description: 'Control playback of audio in voice channels',
    admin: false,
    man: '!audio [next|skip|queue|stop]',
    run: (args, msg, bot) => {
        switch (args[0])
        {
            case "skip":
            case "next":
                return AUDIO_CONTROLLER.skipPlayback(msg.guild.id);
            case "queue":
                return AUDIO_CONTROLLER.getQueue(msg.guild.id);
            case "stop":
                return AUDIO_CONTROLLER.stopPlayback(msg.guild.id);
        }
    }
};
