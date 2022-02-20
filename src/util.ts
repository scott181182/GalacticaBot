import type { Readable } from "stream";

import type {
    Client, GuildMember, VoiceChannel,
    TextChannel, DMChannel
} from "discord.js";
import { AudioResource, createAudioResource, getVoiceConnection, joinVoiceChannel, StreamType, VoiceConnection } from "@discordjs/voice";
import type { VolumeTransformer } from "prism-media";



export type MessageChannel = TextChannel | DMChannel;



export async function isBotConnectedToChannel(channel: VoiceChannel)
{
    if(!channel) { return false; }
    const voxConn = await getVoiceConnection(channel.id);
    return voxConn !== undefined;
}

export async function joinChannelByMember(bot: Client, member: GuildMember): Promise<VoiceConnection>
{
    const memberChannel = member.voice.channel;
    if(!memberChannel) { throw "You must be in a voice channel to issue this command"; }
    const voxConn = await getVoiceConnection(memberChannel.id)
    return voxConn || joinVoiceChannel({
        guildId: memberChannel.guildId,
        channelId: memberChannel.id,
        adapterCreator: memberChannel.guild.voiceAdapterCreator
    })
}



export type AudioResourceWithVolume = AudioResource & { volume: VolumeTransformer };

export function createAudioResourceFromStream(stream: Readable, format: StreamType) {
    return createAudioResource(stream, {
        inputType: format,
        inlineVolume: true
    }) as AudioResourceWithVolume;
}
