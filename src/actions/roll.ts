import { IAction } from "botiful";

export const rollCommand: IAction = {
    name: "roll",
    description: "Rolls the one or the specified number of n-sided dice",
    admin: false,
    man:
        "**Roll Command**:\n" +
        "`roll`  `sides per dice`  `number of dice`\n" +
        "_rolls any number of n-sided dice_\n" +
        "\n" +
        "**Examples:**\n" +
        "`roll 6 1` -- rolls a single six sided dice\n" +
        "`roll 20 2` -- rolls two twenty sided dice",
    run: (args, msg, _bot) => {
        let sides = parseInt(args[0]);
        let numDice = parseInt(args[1]);
        if (isNaN(sides)) {
            return `I didn't understand '${args[0]}' as a number`;
        } else if (isNaN(numDice)) {
            return `I didn't understand '${args[1]}' as a number`;
        } else if (numDice <= 0) {
            return `I couldn't roll '${numDice}' dice`;
        }
        try {
            let rolls = new Array(numDice)
                .fill(0)
                .map(() => Math.floor(Math.random() * sides + 1));
            let sum = rolls.reduce((acc, num, i) => (acc += num));
            return `${numDice} di${
                numDice > 1 ? "ce" : "e"
            } (${sides}-sided): **${sum}**\n${rolls.join(", ")}`;
        } catch (err) {
            return `${numDice} is too many dice!`;
        }
    },
};
