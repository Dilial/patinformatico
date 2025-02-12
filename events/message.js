module.exports = async (client, message) => {
    const args = message.content.slice(prefix.length).trim().split(/ +/g);
  //Making the command lowerCase because our file name will be in lowerCase
  const command = args.shift().toLowerCase();

  //Searching a command
  const cmd =
    client.commands.get(command) ||
    client.commands.find((x) => x.aliases && x.aliases.includes(command));

  //Executing the codes when we get the command or aliases
  if (cmd) {
    /*if (
      (cmd.permissions &&
        cmd.permissions.channel &&
        !message.channel
          .permissionsFor(client.user)
          .has(cmd.permissions.channel)) ||
      (cmd.permissions &&
        cmd.permissions.member &&
        !message.channel
          .permissionsFor(message.member)
          .has(cmd.permissions.member)) ||
      (cmd.permissions &&
        GuildDB.DJ &&
        !message.channel
          .permissionsFor(message.member)
          .has(["ADMINISTRATOR"]) &&
        !message.member.roles.cache.has(GuildDB.DJ))
    )*/
      /*return client.sendError(
        message.channel,
        "Missing Permissions!" + GuildDB.DJ
          ? " You need the `DJ` role to access this command."
          : ""
      );*/
    cmd.run(client, message, args/*, { GuildDB }*/);
  } else return;
};