require('dotenv').config();
const dayjs = require("dayjs");
const { spawn } = require('child_process');
const token = process.env.TOKEN
const clientid = process.env.CLIENTID
const fs = require("fs");
const Discord = require("discord.js");
const { ModalBuilder,TextInputBuilder,Client, PermissionsBitField,ActivityType , DMChannel,GatewayIntentBits, Partials ,ChannelType,EmbedBuilder,ActionRowBuilder,SlashCommandBuilder,SelectMenuBuilder,InteractionType,StringSelectMenuBuilder,StringSelectMenuOptionBuilder} = require('discord.js');
const client = new Discord.Client({intents: [
  Discord.GatewayIntentBits.DirectMessageReactions,
  Discord.GatewayIntentBits.DirectMessageTyping,
  Discord.GatewayIntentBits.DirectMessages,
  Discord.GatewayIntentBits.GuildBans,
  Discord.GatewayIntentBits.GuildEmojisAndStickers,
  Discord.GatewayIntentBits.GuildIntegrations,
  Discord.GatewayIntentBits.GuildInvites,
  Discord.GatewayIntentBits.GuildMembers,
  Discord.GatewayIntentBits.GuildMessageReactions,
  Discord.GatewayIntentBits.GuildMessageTyping,
  Discord.GatewayIntentBits.GuildMessages,
  Discord.GatewayIntentBits.GuildPresences,
  Discord.GatewayIntentBits.GuildScheduledEvents,
  Discord.GatewayIntentBits.GuildVoiceStates,
  Discord.GatewayIntentBits.GuildWebhooks,
  Discord.GatewayIntentBits.Guilds,
  Discord.GatewayIntentBits.MessageContent
], partials: [
  Discord.Partials.Channel,
  Discord.Partials.GuildMember,
  Discord.Partials.GuildScheduledEvent,
  Discord.Partials.Message,
  Discord.Partials.Reaction,
  Discord.Partials.ThreadMember,
  Discord.Partials.User
]});
//現在時間
function getCurrentTimeStamp(){
  return `[${dayjs().format("YYYY/MM/DD HH:mm:ss")}]`
}

function logError(error){
  console.log(`${getCurrentTimeStamp()} [エラー] ${error}`);
}

function FormatCheats(input) {
  const lines = input.split('\n');
  let result = [];

  lines.forEach((line, index) => {
      const blocks = line.replace(/\s+/g, '').match(/.{8}/g);
      if (!blocks) return;

      const secondChar = blocks[0][1];
      if (secondChar === '8') {
          result.push(blocks[3]);
          result.push(blocks[2]);
      } else if (secondChar === '4') {
          result.push(blocks[2]);
      }
  });

  return result.join('\n')
}

function convertEndian(input) {
  const lines = input.split('\n');

  const result = lines.map(line => {
      const bytes = line.match(/.{2}/g);
      if (!bytes) return '';
      return bytes.reverse().join('');
  });

  return result.join('\n');
}

function GetOffset(input){
  return parseInt(input.substring(10, 18), 16).toString(16).toUpperCase()
}

function execCstool(command, args) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args);
    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', (code) => {
      if (code !== 0) {
        reject(`送信したコードを再度確認してください。\n子プロセスの終了コード: ${code}, stderr: ${stderr}`);
        return;
      }
      resolve(stdout);
    });
  });
}

function cstoolInorderer(input) {
  const results = [];

  const lines = input.split('\n');

  lines.forEach(line => {
    const parts = line.trim().split(/\s+/);

    const remainingParts = parts.slice(2);
    const result = remainingParts.map(part => {
      return part.toUpperCase().replace(/0X/g, "0x");
    }).join(' ');

    results.push(result);
  });

  return results.join('\n')
}

function removeComment(input) {
  return input
      .split('\n')
      .map(line => line.split(';')[0])
      .join('\n');
}

function execKstool(command, args) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args);
    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', (code) => {
      if (code !== 0) {
        reject(`エラー内容 : 子プロセスの終了コード: ${code}, stderr: ${stderr}`);
        return;
      }
      resolve(stdout);
    });
  });
}

function cheatCoding(binarysource, offset) {
  let lines = binarysource.split('\n');
  let code = "";
  
  let offsetInt = parseInt(offset, 16);
  
  for (let i = 0; i < Math.floor(lines.length / 2); i++) {
      code += `08000000 ${ (offsetInt + 8 * i).toString(16).padStart(8, '0').toUpperCase()} ${lines[2 * i + 1].trim()} ${lines[2 * i].trim()}\n`;
  }

  if (lines.length % 2 === 1) {
      code += `04000000 ${(offsetInt + 4 * (lines.length - 1)).toString(16).padStart(8, '0').toUpperCase()} ${lines[lines.length - 1].trim()}\n`;
  }
  return code;
}

function ipsCoding(source, offset) {
  // 引数の16進数文字列を改行で分割して配列化
  var lines = source.split('\n');
  let code = ""
  let i = 0

  for (const line of lines) {
      if (i % 10 === 0) {
          if (i !== 0) {
              code += "\n";
          }
          code += `${ (parseInt(offset, 16) + 4 * i).toString(16).padStart(8, '0').toUpperCase()} `;
      }
      code += line.trim();
      i += 1;
  }

  return code;
}

const assemble = new SlashCommandBuilder()
.setName('assemble')
.setDescription('arm64ソースをチートコードにします')

const disassemble = new SlashCommandBuilder()
.setName('disassemble')
.setDescription('チートコードをarm64ソースにします')

const asm2ips = new SlashCommandBuilder()
.setName('ips_assemble')
.setDescription('arm64ソースをipspatch形式します')

const commands = [assemble,disassemble,asm2ips]
const { REST } = require('@discordjs/rest');
 const { Routes } = require('discord-api-types/v10');
const rest = new REST({ version: '10' }).setToken(token)
async function main(){
 	await rest.put(
			Routes.applicationCommands(clientid),
			{ body: commands }
		)
}
main().catch(err => console.log(err))

//mainBOT
client.on('ready', async () => {
  console.log(`${getCurrentTimeStamp()} [BOT起動]\x1b[35m パッケージバージョン:${Discord.version}\u001b[0m `);
  client.user.setPresence({
    activities: [{ name: `${client.guilds.cache.size}サーバー`, type: ActivityType.Competing }],
    status: 'dnd',
  });
});

client.on('guildCreate', guild => {
  console.log(`${getCurrentTimeStamp()} [BOT追加]  \x1b[36m${guild.name}\x1b[0m(\x1b[32m${guild.id}\x1b[0m)に追加された`)
  client.user.setPresence({
    activities: [{ name: `${client.guilds.cache.size}サーバー`, type: ActivityType.Competing }],
    status: 'dnd',
  });
})
client.on('guildDelete', guild => {
  console.log(`${getCurrentTimeStamp()} [BOT削除]  \x1b[36m${guild.name}\x1b[0m(\x1b[32m${guild.id}\x1b[0m)から消された`)
  client.user.setPresence({
    activities: [{ name: `${client.guilds.cache.size}サーバー`, type: ActivityType.Competing }],
    status: 'dnd',
  });
})

client.on('interactionCreate', async (interaction,) => {
  // コマンド実行時
  if (interaction.type === InteractionType.ApplicationCommand) {

    const OffsetImput = new TextInputBuilder()
      .setLabel("0xを含めて、Offsetを入れてね")
      .setCustomId("offset")
      .setStyle("Short")
      .setRequired(true)
      .setPlaceholder("0x000000")
    const ARMSourceInput = new TextInputBuilder()
 			.setLabel("ソースを入れてね")
 			.setCustomId("armsource")
 			.setStyle('Paragraph')
 			.setRequired(true)
      .setPlaceholder("SUB SP, SP, #0x50\nSTR S8,[SP,#0x10]\n...")
    const CodeSourceInput = new TextInputBuilder()
 			.setLabel("チートコードを入れてね")
 			.setCustomId("cheatcode")
 			.setStyle('Paragraph')
 			.setRequired(true)
      .setPlaceholder("08000000 009CBC30 A90353F5 D10143FF\n08000000 009CBC38 910103FD A9047BFD\n...")

    const OffsetActionRow = new ActionRowBuilder().setComponents(OffsetImput);
    if(interaction.commandName == 'assemble'){
      const modal = new ModalBuilder()
 				.setTitle("アセンブラソースからEdizonチートコードに")
 				.setCustomId("assemble");
      const SourceActionRow = new ActionRowBuilder().setComponents(ARMSourceInput);
      modal.setComponents(OffsetActionRow,SourceActionRow);
 			return interaction.showModal(modal);
    }
    if(interaction.commandName == 'ips_assemble'){
      const modal = new ModalBuilder()
 				.setTitle("アセンブラソースからipspatchチートコードに")
 				.setCustomId("ips_assemble");
      const SourceActionRow = new ActionRowBuilder().setComponents(ARMSourceInput);
      modal.setComponents(OffsetActionRow,SourceActionRow);
 			return interaction.showModal(modal);
    }
    if(interaction.commandName == 'disassemble'){

      const modal = new ModalBuilder()
 				.setTitle("Edizonチートコードからアセンブラソースに")
 				.setCustomId("disassemble");
      const SourceActionRow = new ActionRowBuilder().setComponents(CodeSourceInput);
      modal.setComponents(SourceActionRow);
 			return interaction.showModal(modal);
    }

  }
})


client.on('interactionCreate', async (interaction) => {
  if (interaction.user.bot) return;
  if(!interaction.guild)return;
  if (!interaction.isModalSubmit()) return;
    if (interaction.customId == "disassemble"){
      var source = interaction.fields.getTextInputValue('cheatcode')

      var cheatcode = convertEndian(FormatCheats(source)).replace(/[\r\n]+/g, '')
      var startaddress = GetOffset(source)
      try {
        const result = cstoolInorderer(await execCstool('./cstool.exe', ['arm64', cheatcode, `0x${startaddress}`]))
        const embed = new EmbedBuilder()
          .setTitle(`0x${startaddress}`)
          .setDescription(`${result}`)
          .setColor(31415); 
        interaction.reply({embeds : [embed]})
        console.log(`${getCurrentTimeStamp()} [Disassemble] \u001b[32m${interaction.user.displayName}\u001b[0m [${interaction.user.id}] が使用`);

      } catch (error) {
        const embed = new EmbedBuilder()
          .setTitle(`⚠️エラー`)
          .setDescription(error)
          .setColor(16711680); 
        interaction.reply({embeds : [embed]})
        logError(`[Assemble] ${error}`)

      }
    }
    if (interaction.customId == "assemble"){
      var source = interaction.fields.getTextInputValue('armsource')
      var asmsource = removeComment(source).replace(/[\r\n]+/g, '\n')
      var instructions = asmsource.split("\n")
      var startaddress = parseInt(interaction.fields.getTextInputValue('offset'), 16)
      try {
        var errors = ["文法ミス:"]

        if(startaddress % 4 != 0){
          errors.push(`アドレスの値が不正 : 0x${startaddress.toString(16)}`)
        }

        var results = []
        for (let i = 0; i < instructions.length; i++) {
          var result = await execKstool('./kstool.exe', ['arm64', instructions[i], (startaddress + (4*i)).toString(16) ])
          if(result.includes("error")){
            errors.push(`${i+1}行 : ${instructions[i]}`)
          }else{
            results.push(convertEndian(result.split("=")[1].replace(/\[|\]/g, '').replace(/\s+/g, '')).toUpperCase() )
          }
        }

        if(errors.length > 1){
          throw errors.join("\n")
        }
        var assembled = results.join("\n")

        const embed = new EmbedBuilder()
          .setTitle(`出力:`)
          .setDescription(cheatCoding(assembled,startaddress.toString(16)))
          .setColor(31415); 
        interaction.reply({embeds : [embed]})
        console.log(`${getCurrentTimeStamp()} [Aassemble] \u001b[32m${interaction.user.displayName}\u001b[0m [${interaction.user.id}] が使用`);
      } catch (error) {
        const embed = new EmbedBuilder()
          .setTitle(`⚠️エラー`)
          .setDescription(error)
          .setColor(16711680); 
        interaction.reply({embeds : [embed]})
      }
      
    }
    if (interaction.customId == "ips_assemble"){
      var source = interaction.fields.getTextInputValue('armsource')
      var asmsource = removeComment(source).replace(/[\r\n]+/g, '\n')
      var instructions = asmsource.split("\n")
      var startaddress = parseInt(interaction.fields.getTextInputValue('offset'), 16)
      try {
        var errors = ["文法ミス:"]

        if(startaddress % 4 != 0){
          errors.push(`アドレスの値が不正 : 0x${startaddress.toString(16)}`)
        }

        var results = []
        for (let i = 0; i < instructions.length; i++) {
          var result = await execKstool('./kstool.exe', ['arm64', instructions[i], (startaddress + (4*i)).toString(16) ])
          if(result.includes("error")){
            errors.push(`${i+1}行 : ${instructions[i]}`)
          }else{
            results.push(result.split("=")[1].replace(/\[|\]/g, '').replace(/\s+/g, '').toUpperCase())
          }
        }

        if(errors.length > 1){
          throw errors.join("\n")
        }
        var assembled = results.join("\n")

        const embed = new EmbedBuilder()
          .setTitle(`出力:`)
          .setDescription(ipsCoding(assembled,startaddress.toString(16)))
          .setColor(31415); 
        interaction.reply({embeds : [embed]})
        console.log(`${getCurrentTimeStamp()} [IPS-Aassemble] \u001b[32m${interaction.user.displayName}\u001b[0m [${interaction.user.id}] が使用`);
      } catch (error) {
        const embed = new EmbedBuilder()
          .setTitle(`⚠️エラー`)
          .setDescription(error)
          .setColor(16711680); 
        interaction.reply({embeds : [embed]})
      }
      
    }
});

client.login(token);