import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import { existsSync, read, readFileSync, writeFileSync, createReadStream } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));


/////////


const colorcodes = [37, 90, 31, 91, 92];
function log(where, data, color=0) {
    process.stdout.write(`\x1b[${colorcodes[color]}m[${where}]: ${data}\x1b[0m\n`);
};

let broken = false;
process.on('uncaughtException', error => {
    broken = true;
    log('global', error, 3);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

function readFile(path) {
    try {
        return readFileSync(path, { encoding: 'utf-8', flag: 'r' });
    }catch(err){
        log('readFile()', `Error reading the file! path: ${path} error: ${err}`, 2);
    }
};

const API_KEY = process.env.BOT_TOKEN || readFile('./API_KEY.txt');
const bot = new Telegraf(API_KEY);


/////////


class ClubMember {
    constructor(name, username, emoji, photo_source='./imgs/logo.jpg') {
        this.name = name;
        this.username = username;
        this.emoji = emoji;
        this.photo_source = photo_source;
    }
};

const members = [
    new ClubMember('Захар Леванюк', '@KokomaKochi', ['🤫']),
    new ClubMember('Саввва Пеганов', '@dtgbrosry', ['🥶']),
    new ClubMember('Роман Власов', '@Romanchik0000', ['💪']),
    new ClubMember('Артём Мелконян', '@artem8274', ['🥵']),
    new ClubMember('Егор Сметанин', '@Goooldeeen', ['☠️']),
    new ClubMember('Джанер', '@zazer123', ['😮‍💨']),
    new ClubMember('Никита Шатских', '', ['🫡']),
    new ClubMember('Демитрий Коняев', '@fiscif', ['🤙']),
    new ClubMember('Глебарик Мощный', '@icepeak66', ['😍'])
];

async function checkChatMember(ctx) {
    const member = await ctx.telegram.getChatMember('@looksmaxing_club', ctx.chat.id);
    if (member.status != "member" && member.status != "administrator" && member.status != "creator"){
        return false;
    } else {
        return true;
    }
};


/////////


let mediaMessagesId = {};

async function sendPhoto(ctx, chat_id, source, isSpoiler=false) {
    let mediaMessage = await ctx.telegram.sendPhoto(chat_id, { 
        source: source,
        has_spoiler: isSpoiler
    });

    mediaMessagesId[chat_id] = mediaMessage.message_id;
}

async function page_menu(ctx) {
    await ctx.telegram.sendMessage(ctx.message?.chat?.id || ctx.update.callback_query.message.chat.id, 'Привет друг!\n\nПодпишись на канал @looksmaxing_club, если ещё не подписан!\n\nЛюксмакс тебе и твоему дому! 🤫', {
        reply_markup: {
            inline_keyboard: [
                [{text: 'Кто такие люксмаксы?', callback_data: 'whois'}, {text: 'Кто входит в люксмакс?', callback_data: 'clubmembers'}],
                [{text: 'Тапать ЛюксКоины! 🤑', callback_data: 'coins'}]
            ]
        }
    });
};

async function page_whois(ctx) {
    let chat_id = ctx.update.callback_query.message.chat.id;

    /*await ctx.telegram.sendVideo(ctx.update.callback_query.message.chat.id, {
        source: './imgs/whois.mp4',
        caption: 'Этим видео всё сказано.',
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [{text: '<< В меню', callback_data: 'menu'}]
            ]
        }
    });*/

    await sendPhoto(ctx, chat_id, './imgs/whois.jpg');
    await ctx.telegram.sendMessage(chat_id, 'Не чувак, ну такое знать надо 😡', {
        reply_markup: {
            inline_keyboard: [
                [{text: '<< В меню', callback_data: 'menu'}]
            ]
        }
    });
};

async function page_clubmembers(ctx) {
    let chat_id = ctx.update.callback_query.message.chat.id;

    let string = '<b>👇 Вот они все 👇</b>\n\n';
    for(let member of members) {
        string += `${member.name} ${member.username}\n`;
    };
    string += '\n(Учи запоминай, повторяй перед сном)';

    await sendPhoto(ctx, chat_id, './imgs/members.jpg');

    await ctx.telegram.sendMessage(chat_id, string, {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                    [{text: 'Случайный Люксмакс! 🎲', callback_data: 'random'}],
                    [{text: '<< В меню', callback_data: 'menu'}]
            ]
        }
    });
};

async function page_random(ctx) {
    let chat_id = ctx.update.callback_query.message.chat.id;

    let memberIndex = Math.floor(Math.random()*members.length);
    
    if(memberIndex >= members.length)
        memberIndex -= 1;

    let member = members[memberIndex];

    //await sendPhoto(ctx, chat_id, member.photo_source, true);
    await ctx.telegram.sendMessage(chat_id, `<b>В этот раз тебе выпал: \n <tg-spoiler>${member.name} ${member.emoji[0]}</tg-spoiler></b>\n\n *теперь ты должен ему сотку `, {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [{text: 'Крутить снова! 🎲', callback_data: 'random'}],
                [{text: '<< В меню', callback_data: 'menu'}]
            ]
        }
    });
};

async function page_coins(ctx) {
    await ctx.telegram.sendMessage(ctx.update.callback_query.message.chat.id, `извини брат, пока не готово, скоро будет`, {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [{text: '<< В меню', callback_data: 'menu'}]
            ]
        }
    });
};


/////////


bot.command('start', async ctx => {
    if(true) {
        await page_menu(ctx);
    }else{

    }
});

bot.command('menu', page_menu);

bot.on('callback_query', async ctx => {
    const chat_id = ctx.update.callback_query.message.chat.id

    await ctx.telegram.answerCbQuery(ctx.callbackQuery.id)

    if(chat_id in mediaMessagesId && mediaMessagesId[chat_id] != 0) {
        await ctx.telegram.deleteMessage(chat_id, mediaMessagesId[chat_id])
        mediaMessagesId[chat_id] = 0;
    };

    await ctx.telegram.deleteMessage(chat_id, ctx.update.callback_query.message.message_id);

    switch(ctx.update.callback_query.data) {
        case 'menu':
            await page_menu(ctx);
            break;

        case 'whois':
            await page_whois(ctx);
            break;

        case 'clubmembers':
            await page_clubmembers(ctx);
            break;

        case 'random':
            await page_random(ctx);
            break;

        case 'coins':
            await page_coins(ctx);
            break;
    }
});


bot.on('message', async ctx => {
    let text = ctx.message?.text || ctx.update.message?.text || '';

    if(text.replace(/\s/g, '').toLowerCase() == 'идинахуй') {
        await ctx.telegram.sendMessage(ctx.message?.chat?.id || ctx.update.message.chat.id, 'сам сходи');
    }else if(text.replace(/\s/g, '')[0] == '/'){

    }else{
        await ctx.telegram.sendMessage(ctx.message?.chat?.id || ctx.update.message.chat.id, 'еблан по русски скажи че те надо');
        await ctx.telegram.sendMessage(ctx.message?.chat?.id || ctx.update.message.chat.id, 'нихуя не понимаю че ты высрал');
    }
});


/////////


bot.launch();

if(!broken) 
    log('global', 'the bot is running', 4);