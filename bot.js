import { Telegraf } from 'telegraf';
import { readFile } from 'fs/promises';


/////////


const colorcodes = [37, 90, 31, 91, 92];

function log(data, where='global', color=0) {
    process.stdout.write(`\x1b[${colorcodes[color]}m[${where}]: ${data}\x1b[0m\n`);
};

let broken = false;

process.on('uncaughtException', err => {
    broken = true;
    log(`Fatal global error! ${err}`, 'global', 3);
});

async function _readFile(path) {
    return new Promise( res => {
        readFile(path, { encoding: 'utf8' })
            .then(res)
            .catch(err => {
                log(`Error reading the file! path: ${path} error: ${err}`, 'readFile()', 2);
                return null;
            });
    });
};

const BOT_TOKEN = process.env.BOT_TOKEN || await _readFile('./BOT_TOKEN.txt') || '7818057731:AAEPt-Q-IFtGLgX-zpSvroPJoPtCHNVL1cA';

if(!BOT_TOKEN) {
    throw new Error('BOT_TOKEN not found in environment variables / local file');
};

const bot = new Telegraf(BOT_TOKEN);

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));


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
    new ClubMember('Никита Шатских', '(в васапе сидит)', ['🫡']),
    new ClubMember('Демитрий Коняев', '@fiscif', ['🤙']),
    new ClubMember('Глебарик Мощный', '@icepeak66', ['😍'])
];

/*async function checkChatMember(ctx) {
    const member = await ctx.telegram.getChatMember('@looksmaxing_club', ctx.chat.id);
    if (member.status != "member" && member.status != "administrator" && member.status != "creator"){
        return false;
    } else {
        return true;
    }
};*/


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
    let chat_id = ctx.message?.chat?.id || ctx.update.callback_query.message.chat.id;
    await ctx.telegram.sendMessage(chat_id, 'Привет друг!\n\nПодпишись на канал @looksmaxing_club, если ещё не подписан!\n\nЛюксмакс тебе и твоему дому! 🤫', {
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
        string += `${member.emoji[0]} ${member.name} ${member.username}\n`;
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
    let chat_id = ctx.message?.chat?.id || ctx.update.message.chat.id;
    let text = ctx.message?.text || ctx.update.message?.text || '';
    let raw_text = text.replace(/\s/g, '').toLowerCase();

    if(raw_text == 'идинахуй' || raw_text == 'пошёлнахуй' || raw_text == 'пошёлнахрен') {
        await ctx.telegram.sendMessage(chat_id, 'сам сходи');
    }else if(text.replace(/\s/g, '')[0] == '/'){
        // its command
    }else{
        await ctx.telegram.sendMessage(chat_id, 'еблан по русски скажи че те надо');
        await ctx.telegram.sendMessage(chat_id, 'нихуя не понимаю че ты высрал');
    }
});


/////////


bot.launch();

if(!broken) {
    log('the bot is running', 'global', 4);
} 