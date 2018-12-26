import {
    Client, GuildMember, VoiceChannel, VoiceConnection,
    TextChannel, DMChannel, GroupDMChannel
} from "discord.js";


export type MessageChannel = TextChannel | DMChannel | GroupDMChannel;

export function isBotConnectedToChannel(bot: Client, channel: VoiceChannel)
{
    if(!channel) { return false; }
    return bot.voiceConnections.some(connection => connection.channel.id === channel.id);
}

export async function joinChannelByMember(bot: Client, member: GuildMember): Promise<VoiceConnection>
{
    if(!member.voiceChannel) { return Promise.reject("You must be in a voice channel to issue this command"); }
    const alreadyConnected = bot.voiceConnections.find(connection => connection.channel.id === member.voiceChannel.id);
    if(alreadyConnected) { return Promise.resolve(alreadyConnected); }
    return member.voiceChannel.join();
}
