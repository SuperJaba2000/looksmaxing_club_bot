import { Telegraf } from 'telegraf';
import { readFile } from 'fs/promises';


/////////
// Configuration and utilities


const color_codes = [37, 90, 31, 91, 92];

function log(data, where='global', color=0) {
    process.stdout.write(`\x1b[${color_codes[color]}m[${where}]: ${data}\x1b[0m\n`);
};

let isBroken = false;

process.on('uncaughtException', err => {
    isBroken = true;
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


/////////
// Initialization


const BOT_TOKEN = process.env.BOT_TOKEN || await _readFile('./BOT_TOKEN.txt');

if(!BOT_TOKEN) {
    throw new Error('BOT_TOKEN not found in environment variables / local file');
};

const bot = new Telegraf(BOT_TOKEN);

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));


/////////
// The data model


class ClubMember {
    constructor(name, username, emoji, photo_source='./assets/imgs/logo.jpg') {
        this.name = name;
        this.username = username;
        this.emoji = emoji;
        this.photo_source = photo_source;
    }
};

const MEMBERS = [
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
// The life cycle of media messages


function getChatId(ctx) {
    return ctx.message?.chat?.id || ctx.update?.callback_query?.message?.chat.id || ctx.update?.message?.chat.id;
}

let mediaMessagesCache = new Map();

async function sendMediaMessage(ctx, source) {
    let chatId = getChatId(ctx);

    try {
        const mediaMessage = await ctx.telegram.sendPhoto(chatId, { 
            source: source
        });
        mediaMessagesCache.set(chatId, mediaMessage.message_id);
    } catch (err) {
        log(`Failed to send media message: ${err}`, 'sendMediaMessage', 2);
    }
}


async function cleanupMediaMessages(ctx) {
    let chatId = getChatId(ctx);

    if (mediaMessagesCache.has(chatId)) {
        try {
            await ctx.telegram.deleteMessage(chatId, mediaMessagesCache.get(chatId));
            mediaMessagesCache.delete(chatId);
        } catch (err) {
            log(`Failed to delete media message: ${err}`, 'cleanupMediaMessages', 'red');
        }
    }
}


/////////
// User Interface Pages


const PAGES = {
    menu: async ctx =>{
        let chatId = getChatId(ctx);
    
        await ctx.telegram.sendMessage(chatId, 'Привет друг!\n\nПодпишись на канал @looksmaxing_club, если ещё не подписан!\n\nЛюксмакс тебе и твоему дому! 🤫', {
            reply_markup: {
                inline_keyboard: [
                    [{text: 'Кто такие люксмаксы?', callback_data: 'whois'}, {text: 'Кто входит в люксмакс?', callback_data: 'clubmembers'}],
                    [{text: 'Тапать ЛюксКоины! 🤑', callback_data: 'coins'}]
                ]
            }
        });
    },

    whois: async ctx => {
        let chatId = getChatId(ctx);
    
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
    
        await sendMediaMessage(ctx, './assets/imgs/whois.jpg');
        await ctx.telegram.sendMessage(chatId, 'Не чувак, ну такое знать надо 😡', {
            reply_markup: {
                inline_keyboard: [
                    [{text: '<< В меню', callback_data: 'menu'}]
                ]
            }
        });
    },

    clubmembers: async ctx => {
        let chatId = getChatId(ctx);
    
        const membersList = MEMBERS.map(m => `${m.emoji[0]} ${m.name} ${m.username}`).join('\n');
            
        await sendMediaMessage(ctx, './imgs/members.jpg');
        await ctx.telegram.sendMessage(chatId, `<b>👇 Вот они все 👇</b>\n\n${membersList}\n\n(Учи запоминай, повторяй перед сном)`, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Случайный Люксмакс! 🎲', callback_data: 'random' }],
                    [{ text: '<< В меню', callback_data: 'menu' }]
                ]
            }
        });
    },

    random: async ctx => {
        let chatId = getChatId(ctx);
    
        let memberIndex = Math.floor(Math.random()*MEMBERS.length);
        
        if(memberIndex >= MEMBERS.length)
            memberIndex -= 1;
    
        let member = MEMBERS[memberIndex];
    
        //await sendPhoto(ctx, chat_id, member.photo_source, true);
        await ctx.telegram.sendMessage(chatId, `<b>В этот раз тебе выпал: \n <tg-spoiler>${member.name} ${member.emoji[0]}</tg-spoiler></b>\n\n *теперь ты должен ему сотку `, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [{text: 'Крутить снова! 🎲', callback_data: 'random'}],
                    [{text: '<< В меню', callback_data: 'menu'}]
                ]
            }
        });
    },

    coins: async ctx => {
        let chatId = getChatId(ctx);
    
        await ctx.telegram.sendMessage(chatId, `извини брат, пока не готово, скоро будет`, {
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [{text: '<< В меню', callback_data: 'menu'}]
                ]
            }
        });
    }
};


/////////
// Event handlers


bot.command('start', async ctx => {
    if(true) {
        await PAGES.menu(ctx);
    }else{

    }
});

bot.command('menu', PAGES.menu);

bot.on('callback_query', async ctx => {
    const chatId = getChatId(ctx);
    const action = ctx.update?.callback_query?.data;

    try {
        await ctx.telegram.answerCbQuery(ctx.callbackQuery.id);
        await cleanupMediaMessages(ctx);
        await ctx.telegram.deleteMessage(chatId, ctx.update.callback_query.message.message_id);

        if (PAGES[action]) {
            await PAGES[action](ctx);
        }
    } catch (err) {
        log(`Callback query error: ${err}`, 'callback_query', 2);
    }
});


bot.on('message', async ctx => {
    const chatId = getChatId(ctx);
    const rawText = (ctx.message?.text || ctx.update.message?.text || '').replace(/\s/g, '').toLowerCase();

    if (['идинахуй', 'пошёлнахуй', 'пошёлнахрен'].includes(rawText)) {
        await ctx.telegram.sendMessage(chatId, 'сам сходи');
    } else if (!rawText.startsWith('/')) {
        await ctx.telegram.sendMessage(chatId, 'еблан по русски скажи че те надо');
        await ctx.telegram.sendMessage(chatId, 'нихуя не понимаю че ты высрал');
    }
});


/////////


bot.launch().then( () => {
    if(!isBroken) {
        log('the bot is running', 'global', 4);
    } 
});