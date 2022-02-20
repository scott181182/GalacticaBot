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
            case "stop":
                return AUDIO_CONTROLLER.stopPlayback(msg.guildId);
        }
    }
};
