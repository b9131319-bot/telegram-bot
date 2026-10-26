const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

const TOKEN = '8875290524:AAFYRFTuHXH4mcSn6q4v7I9V7YRFrDtSeHg';
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
                points: 10, // هدية ترحيبية 10 نقاط
                ordersCount: 0,
                lastDaily: 0,
                lastOrder: null,
                lastTiktokTask: 0
            };
        }

        if (text === '/start') {
            const welcomeText = `أهلاً بك يا *${userName}* في بوت الخدمات والمتكامل 🚀\n\n` +
                `🎁 حصلت على 10 نقاط كهدية ترحيبية!\n\n` +
                `منور المتجر يا غالي إذا عجبك لاتنسانا من دعمك 🤍`;

            // أزرار مربعات (جنب بعض) مثل الصورة الثانية
            const keyboard = {
                inline_keyboard: [
                    [
                        { text: '🎁 الهدية اليومية', callback_data: 'daily_gift' },
                        { text: '🛍️ المتجر والخدمات', callback_data: 'services_menu' }
                    ],
                    [
                        { text: '📌 مهام تيك توك (20)', callback_data: 'tiktok_tasks' },
                        { text: '🎮 تجميع نقاط والألعاب', callback_data: 'games_menu' }
                    ],
                    [
                        { text: '👤 حسابي ونقاطي', callback_data: 'my_account' },
                        { text: '📦 تتبع آخر طلب', callback_data: 'track_order' }
                    ],
                    [
                        { text: '🔗 رابط الدعوة', callback_data: 'invite_friends' },
                        { text: '🛠️ الدعم الفني', callback_data: 'support' }
                    ]
                ]
            };
            await sendMessage(chatId, welcomeText, keyboard);
        }
    } 
    else if (update.callback_query) {
        const chatId = update.callback_query.message.chat.id;
        const data = update.callback_query.data;

        if (!users[chatId]) {
            users[chatId] = { points: 10, ordersCount: 0, lastDaily: 0, lastOrder: null, lastTiktokTask: 0 };
        }

        // دالة لإعادة إرسال القائمة الرئيسية مرتبة
        const sendMainMenu = async (customMsg = '') => {
            const menuText = `${customMsg}\n\n🎛️ **القائمة الرئيسية:**\nلديك حالياً: *${users[chatId].points} نقطة* 🪙\n\nمنور المتجر يا غالي إذا عجبك لاتنسانا من دعمك 🤍`;
            const menuKeyboard = {
                inline_keyboard: [
                    [
                        { text: '🎁 الهدية اليومية', callback_data: 'daily_gift' },
                        { text: '🛍️ المتجر والخدمات', callback_data: 'services_menu' }
                    ],
                    [
                        { text: '📌 مهام تيك توك (20)', callback_data: 'tiktok_tasks' },
                        { text: '🎮 تجميع نقاط والألعاب', callback_data: 'games_menu' }
                    ],
                    [
                        { text: '👤 حسابي ونقاطي', callback_data: 'my_account' },
                        { text: '📦 تتبع آخر طلب', callback_data: 'track_order' }
                    ],
                    [
                        { text: '🔗 رابط الدعوة', callback_data: 'invite_friends' },
                        { text: '🛠️ الدعم الفني', callback_data: 'support' }
                    ]
                ]
            };
            await sendMessage(chatId, menuText, menuKeyboard);
        };

        if (data === 'main_menu') {
            await sendMainMenu();
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
        else if (data === 'tiktok_tasks') {
            const now = Date.now();
            const cooldown = 60 * 60 * 1000; // ساعة واحدة
            if (now - users[chatId].lastTiktokTask < cooldown) {
                await sendMessage(chatId, `⏳ لقد أنجزت مهمة تيك توك مؤخراً، انتظر قليلاً لتظهر مهام جديدة!`);
            } else {
                users[chatId].lastTiktokTask = now;
                users[chatId].points += 20;
                await sendMessage(chatId, `📌 **مهمة تيك توك:**\nقم بمتابعة الحساب وزيارة الرابط التالي:\n🔗 https://www.tiktok.com/@e..e233\n\n✅ تم التحقق وإضافة *20 نقطة* لرصيدك 🪙!\nرصيدك الحالي: ${users[chatId].points} نقطة.`);
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
                await sendMessage(chatId, `🏆 يا بطل! فزت على الذكاء الاصطناعي الصعب!\n+20 نقطة 🪙 (رصيدك: ${users[chatId].points})`);
            } else if (result === 'draw') {
                users[chatId].points += 10;
                await sendMessage(chatId, `🤝 تعادل مثير مع الذكاء الاصطناعي!\n+10 نقاط 🪙 (رصيدك: ${users[chatId].points})`);
            } else {
                await sendMessage(chatId, `❌ هاردلك يا غالي، هزمك الذكاء الاصطناعي!\n0 نقاط. حاول مرة أخرى!`);
            }
        }
        else if (data === 'play_guess') {
            users[chatId].points += 5;
            await sendMessage(chatId, `🔮 توقعك كان صحيحاً!\n+5 نقاط أضيفت لرصيدك 🪙 (رصيدك: ${users[chatId].points})`);
        }
        else if (data === 'my_account') {
            const accText = `👤 **معلومات حسابك:**\n\n` +
                `🪙 إجمالي النقاط المكتسبة: *${users[chatId].points} نقطة*\n` +
                `📦 عدد الطلبات الكلي: *${users[chatId].ordersCount} طلب*\n` +
                `🏷️ معرف المستخدم (ID): \`${chatId}\``;
            
            const accKeyboard = {
                inline_keyboard: [
                    [{ text: '⬅️ رجوع للقائمة الرئيسية', callback_data: 'main_menu' }]
                ]
            };
            await sendMessage(chatId, accText, accKeyboard);
        }
        else if (data === 'track_order') {
            if (!users[chatId].lastOrder) {
                await sendMessage(chatId, `⚠️ ليس لديك أي طلبات سابقة لتتبعها قم بطلب خدمة أولاً من المتجر!`);
            } else {
                await sendMessage(chatId, `📌 **تتبع الطلب الأخير:**\nرقم طلبك: \`${users[chatId].lastOrder}\`\nحالة الطلب: جاري التنفيذ بنجاح 🚀\n🤍`);
            }
        }
        else if (data === 'services_menu') {
            const servText = `📦 **قسم المتجر وخدمات الدعم وزيادة المتابعين:**\nاختر الخدمة التي تريد طلبها:`;
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
                `📌 رقم طلبك للتتبع: \`${orderId}\`\n` +
                `سيتم البدء في تنفيذ طلبك في أقرب وقت.\n🤍`;
            await sendMessage(chatId, replyMsg);
        }
        else if (data === 'invite_friends') {
            const botUsername = 'RATX000_bot';
            const inviteLink = `https://t.me/${botUsername}?start=ref_${chatId}`;
            users[chatId].points += 50;
            await sendMessage(chatId, `🔗 **رابط الدعوة الخاص بك:**\n\`${inviteLink}\`\n\nشارك الرابط مع أصدقائك وكل شخص يدخل تكسب عليه *50 نقطة* 🪙!`);
        }
        else if (data === 'support') {
            await sendMessage(chatId, `🛠️ **الدعم الفني:**\nللتواصل المباشر مع فريق الدعم:\n👤 @abod097644`);
        }
    }

    res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
