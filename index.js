const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

const TOKEN = '8875290524:AAG0U7qxmq__3gh6mqFYmFLDs3yAPF9xJg';
const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;

const users = {};

async function sendMessage(chatId, text, replyMarkup = null) {
    try {
        const payload = {
            chat_id: chatId,
            text: text,
            parse_mode: 'Markdown'
        };
        if (replyMarkup) {
            payload.reply_markup = replyMarkup;
        }
        await axios.post(`${TELEGRAM_API}/sendMessage`, payload);
    } catch (error) {
        console.error('خطأ في إرسال الرسالة:', error.response?.data || error.message);
    }
}

app.post(`/webhook/${TOKEN}`, async (req, res) => {
    const update = req.body;

    if (update.message && update.message.text) {
        const chatId = update.message.chat.id;
        const text = update.message.text;
        const userName = update.message.from.first_name || 'مستخدم';

        if (!users[chatId]) {
            users[chatId] = {
                points: 0,
                ordersCount: 0,
                lastDaily: 0,
                lastOrder: null
            };
        }

        if (text === '/start') {
            const welcomeText = ` أهلاً بك يا *${userName}* في بوت الخدمات المتكامل 🚀\n\n` +
                `⚠️ **عذراً، يجب عليك أولاً متابعة حساب التيك توك التالي لكي يعمل معك البوت بنجاح:**\n` +
                `🔗 https://www.tiktok.com/@e..e233?_r=1&_t=ZS-9AsxCVPXzrY\n\n` +
                `بعد متابعة الحساب، اضغط على زر القائمة أدناه للبدء واستخدام خدمات البوت واستلام نقاطك! ❤️`;

            const keyboard = {
                inline_keyboard: [
                    [{ text: '📋 القائمة الرئيسية للخدمات والأقسام', callback_data: 'main_menu' }]
                ]
            };
            await sendMessage(chatId, welcomeText, keyboard);
        }
    } 
    else if (update.callback_query) {
        const chatId = update.callback_query.message.chat.id;
        const data = update.callback_query.data;

        if (!users[chatId]) {
            users[chatId] = { points: 0, ordersCount: 0, lastDaily: 0, lastOrder: null };
        }

        if (data === 'main_menu') {
            const menuText = `🎛️ **القائمة الرئيسية - اختر ما يناسبك:**\nلديك حالياً: *${users[chatId].points} نقطة* 🪙`;
            const menuKeyboard = {
                inline_keyboard: [
                    [{ text: '🎁 الهدية اليومية (15 نقطة)', callback_data: 'daily_gift' }],
                    [{ text: '🎮 ألعاب وتحديات (اكس أو / توقعات)', callback_data: 'games_menu' }],
                    [{ text: '🎡 عجلة الحظ (10 إلى 100 نقطة)', callback_data: 'lucky_wheel' }],
                    [{ text: '👤 حسابي ونقاطي وطلباتي', callback_data: 'my_account' }],
                    [{ text: '📦 خدمات دعم (تيك توك، يوتيوب، انستقرام)', callback_data: 'services_menu' }],
                    [{ text: '🔗 دعوة أصدقاء (50 نقطة)', callback_data: 'invite_friends' }, { text: '🛠️ الدعم الفني', callback_data: 'support' }]
                ]
            };
            await sendMessage(chatId, menuText, menuKeyboard);
        }
        else if (data === 'daily_gift') {
            const now = Date.now();
            const oneDay = 24 * 60 * 60 * 1000;
            if (now - users[chatId].lastDaily < oneDay) {
                await sendMessage(chatId, `⏳ لقد استلمت هدديتك اليومية مسبقاً! عُد بعد مرور 24 ساعة.`);
            } else {
                users[chatId].lastDaily = now;
                users[chatId].points += 15;
                await sendMessage(chatId, `🎉 مبروك يا غالي! حصلت على هدديتك اليومية *15 نقطة* 🪙.\nرصيدك الحالي: ${users[chatId].points} نقطة.`);
            }
        }
        else if (data === 'games_menu') {
            const gamesText = `🎮 **قسم الألعاب والتحديات:**\nاختر اللعبة المناسبة واجمع النقاط!`;
            const gamesKeyboard = {
                inline_keyboard: [
                    [{ text: '❌ ⭕ لعبة اكس أو (ضد الذكاء الاصطناعي)', callback_data: 'play_xo' }],
                    [{ text: '🔮 لعبة التوقعات السريعة', callback_data: 'play_guess' }],
                    [{ text: '⬅️ رجوع للقائمة الرئيسية', callback_data: 'main_menu' }]
                ]
            };
            await sendMessage(chatId, gamesText, gamesKeyboard);
        }
        else if (data === 'play_xo') {
            const outcomes = ['win', 'draw', 'lose', 'lose', 'lose'];
            const result = outcomes[Math.floor(Math.random() * outcomes.length)];

            if (result === 'win') {
                users[chatId].points += 20;
                await sendMessage(chatId, `🏆 يا بطل! لعبت بذكاء وفزت على الذكاء الاصطناعي الصعب!\n+20 نقطة 🪙 (رصيدك: ${users[chatId].points})`);
            } else if (result === 'draw') {
                users[chatId].points += 10;
                await sendMessage(chatId, `🤝 تعادل مثير مع الذكاء الاصطناعي!\n+10 نقاط 🪙 (رصيدك: ${users[chatId].points})`);
            } else {
                await sendMessage(chatId, `❌ هاردلك يا غالي، الذكاء الاصطناعي كان قوياً وهزمك!\n0 نقاط. حاول مرة أخرى!`);
            }
        }
        else if (data === 'play_guess') {
            users[chatId].points += 5;
            await sendMessage(chatId, `🔮 اخترت توقعاً صحيحاً وسريعاً من نظرتك!\n+5 نقاط أضيفت لرصيدك 🪙 (رصيدك: ${users[chatId].points})`);
        }
        else if (data === 'lucky_wheel') {
            const rand = Math.random();
            let prize = 10;
            if (rand < 0.02) prize = 100;
            else if (rand < 0.20) prize = 50;
            else if (rand < 0.50) prize = 25;

            users[chatId].points += prize;
            await sendMessage(chatId, `🎡 دَارَت عجلة الحظ واستقرت على:\n✨ *${prize} نقطة* 🪙!\nرصيدك الإجمالي الآن: ${users[chatId].points} نقطة.`);
        }
        else if (data === 'my_account') {
            const accText = `👤 **معلومات حسابك:**\n\n` +
                `🪙 إجمالي النقاط المكتسبة: *${users[chatId].points} نقطة*\n` +
                `📦 عدد الطلبات الكلي: *${users[chatId].ordersCount} طلب*\n` +
                `🏷️ معرف المستخدم (ID): \`${chatId}\``;
            
            const accKeyboard = {
                inline_keyboard: [
                    [{ text: '🔍 تتبع آخر طلب لي', callback_data: 'track_order' }],
                    [{ text: '⬅️ رجوع للقائمة الرئيسية', callback_data: 'main_menu' }]
                ]
            };
            await sendMessage(chatId, accText, accKeyboard);
        }
        else if (data === 'track_order') {
            if (!users[chatId].lastOrder) {
                await sendMessage(chatId, `⚠️ ليس لديك أي طلبات سابقة لتتبعها قم بطلب خدمة أولاً!`);
            } else {
                await sendMessage(chatId, `📌 *تتبع الطلب الأخير:*\nرقم طلبك هو: \`${users[chatId].lastOrder}\`\nحالة الطلب: جاري التنفيذ بنجاح 🚀\n❤️`);
            }
        }
        else if (data === 'services_menu') {
            const servText = `📦 **قسم خدمات الدعم وزيادة المتابعين:**\nاختر الخدمة التي تريد طلبها:`;
            const servKeyboard = {
                inline_keyboard: [
                    [{ text: '🎵 زيادة متابعين ومشاهدات تيك توك', callback_data: 'order_tiktok' }],
                    [{ text: '📺 زيادة متابعين ومشاهدات يوتيوب', callback_data: 'order_youtube' }],
                    [{ text: '📸 زيادة متابعين وتفاعلات انستقرام', callback_data: 'order_insta' }],
                    [{ text: '⬅️ رجوع للقائمة الرئيسية', callback_data: 'main_menu' }]
                ]
            };
            await sendMessage(chatId, servText, servKeyboard);
        }
        else if (data.startsWith('order_')) {
            users[chatId].ordersCount += 1;
            const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
            users[chatId].lastOrder = orderId;

            const replyMsg = `✅ **تم قبول طلبك يا غالي بكل سرور!**\n\n` +
                `📌 هذا هو رقم طلبك إذا كنت تبي تتبعه لاحقاً: \`${orderId}\`\n` +
                `سيتم البدء في تنفيذ طلبك في أقرب وقت ممكن.\n❤️`;
            await sendMessage(chatId, replyMsg);
        }
        else if (data === 'invite_friends') {
            const botUsername = 'RATX000_bot';
            const inviteLink = `https://t.me/${botUsername}?start=ref_${chatId}`;
            users[chatId].points += 50;
            await sendMessage(chatId, `🔗 **رابط الدعوة الخاص بك:**\n\`${inviteLink}\`\n\nشارك الرابط مع أصدقائك، وكل شخص يدخل من خلاله تكسب عليه *50 نقطة* 🪙!\n(تمت إضافة 50 نقطة كمكافأة تجريبية، رصيدك: ${users[chatId].points})`);
        }
        else if (data === 'support') {
            await sendMessage(chatId, `🛠️ **الدعم الفني والخدمة:**\nللتواصل المباشر مع فريق الدعم الفني، يرجى مراسلة الحساب التالي:\n👤 @abod097644`);
        }
    }

    res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
