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

async function editMessageText(chatId, messageId, text, replyMarkup = null) {
    try {
        const payload = {
            chat_id: chatId,
            message_id: messageId,
            text: text,
            parse_mode: 'Markdown'
        };
        if (replyMarkup) {
            payload.reply_markup = replyMarkup;
        }
        await axios.post(`${TELEGRAM_API}/editMessageText`, payload);
    } catch (error) {}
}

app.post(`/webhook/${TOKEN}`, async (req, res) => {
    const update = req.body;

    if (update.message && update.message.text) {
        const chatId = update.message.chat.id;
        const text = update.message.text;
        const userName = update.message.from.first_name || 'مستخدم';

        if (!users[chatId]) {
            users[chatId] = {
                points: 20,
                ordersCount: 0,
                lastDaily: 0,
                lastWheel: 0,
                lastOrder: null,
                gameMode: null,
                targetNum: null,
                isSubscribed: false // شرط المتابعة مغلق بالبداية
            };
        }

        if (users[chatId].gameMode === 'guessing') {
            const guessedNum = parseInt(text);
            if (isNaN(guessedNum) || guessedNum < 1 || guessedNum > 7) {
                await sendMessage(chatId, `⚠️ يا غالي، اختر رقماً صحيحاً بين 1 و 7 فقط!`);
            } else {
                if (guessedNum === users[chatId].targetNum) {
                    users[chatId].points += 15;
                    users[chatId].gameMode = null;
                    await sendMessage(chatId, `🎉 كفووو! الرقم صحيح (${guessedNum}) وتوقعت بدقة!\n+15 نقطة أضيفت لرصيدك 🪙 (رصيدك: ${users[chatId].points})`);
                } else {
                    const correctN = users[chatId].targetNum;
                    users[chatId].gameMode = null;
                    await sendMessage(chatId, `❌ هاردلك! الرقم الصحيح كان (${correctN}). حاول مرة أخرى من القائمة!`);
                }
            }
            return res.sendStatus(200);
        }

        if (text === '/start') {
            users[chatId].isSubscribed = false; // إعادة تعيين لكي يتم إلزامه بالمتابعة

            const subText = `🌹 أهلاً بك يا *${userName}* في بوت الخدمات المتكامل 🤍\n\n` +
                `⚠️ **عذراً يا غالي، لا يمكنك استخدام البوت أو ظهور القائمة حتى تقوم بمتابعة حساب التيك توك الخاص بنا:**\n` +
                `🔗 https://www.tiktok.com/@e..e233\n\n` +
                `🌸 بعد إتمام المتابعة، اضغط على زر **"تحقق من المتابعة ✅"** بالأسفل لفتح البوت واستلام هدديتك ومميزات المتجر! ✨`;

            const subKeyboard = {
                inline_keyboard: [
                    [{ text: '🔗 رابط حساب التيك توك', url: 'https://www.tiktok.com/@e..e233' }],
                    [{ text: '✅ تحقق من المتابعة لفتح البوت', callback_data: 'check_subscription' }]
                ]
            };
            await sendMessage(chatId, subText, subKeyboard);
        }
    } 
    else if (update.callback_query) {
        const chatId = update.callback_query.message.chat.id;
        const messageId = update.callback_query.message.message_id;
        const data = update.callback_query.data;

        if (!users[chatId]) {
            users[chatId] = { points: 20, ordersCount: 0, lastDaily: 0, lastWheel: 0, lastOrder: null, gameMode: null, targetNum: null, isSubscribed: false };
        }

        // زر التحقق الإلزامي من المتابعة
        if (data === 'check_subscription') {
            users[chatId].isSubscribed = true; // تم التحقق وفتح البوت

            const welcomeText = `🌹 منور المتجر يا غالي إذا عجبك لاتنسانا من دعمك 🤍✨\n\n` +
                `🎁 تم التحقق بنجاح وفتح جميع خدمات البوت والألعاب لك! اختر ما يناسبك من القائمة أدناه:`;

            const mainKeyboard = {
                inline_keyboard: [
                    [
                        { text: '🎁 الهدية اليومية', callback_data: 'daily_gift' },
                        { text: '🛍️ المتجر والخدمات', callback_data: 'services_menu' }
                    ],
                    [
                        { text: '🎮 الألعاب وتجميع النقاط', callback_data: 'games_menu' },
                        { text: '👤 حسابي ونقاطي', callback_data: 'my_account' }
                    ],
                    [
                        { text: '📦 تتبع آخر طلب', callback_data: 'track_order' },
                        { text: '🛠️ الدعم الفني', callback_data: 'support' }
                    ]
                ]
            };
            await editMessageText(chatId, messageId, welcomeText, mainKeyboard);
            return res.sendStatus(200);
        }

        // حماية أمان: إذا لم يكن مشتركاً وحاول يضغط أي زر آخر، نمنعه ونرجعه للتيك توك
        if (!users[chatId].isSubscribed) {
            await sendMessage(chatId, `⚠️ عذراً يا غالي! يجب عليك أولاً متابعة حساب التيك توك والضغط على زر التحقق لكي يعمل معك البوت.\n🔗 https://www.tiktok.com/@e..e233`);
            return res.sendStatus(200);
        }

        if (data === 'main_menu') {
            const menuText = `🎛️ **القائمة الرئيسية:**\nلديك حالياً: *${users[chatId].points} نقطة* 🪙\n\n🌹 منور المتجر يا غالي إذا عجبك لاتنسانا من دعمك 🤍✨`;
            const menuKeyboard = {
                inline_keyboard: [
                    [
                        { text: '🎁 الهدية اليومية', callback_data: 'daily_gift' },
                        { text: '🛍️ المتجر والخدمات', callback_data: 'services_menu' }
                    ],
                    [
                        { text: '🎮 الألعاب وتجميع النقاط', callback_data: 'games_menu' },
                        { text: '👤 حسابي ونقاطي', callback_data: 'my_account' }
                    ],
                    [
                        { text: '📦 تتبع آخر طلب', callback_data: 'track_order' },
                        { text: '🛠️ الدعم الفني', callback_data: 'support' }
                    ]
                ]
            };
            await editMessageText(chatId, messageId, menuText, menuKeyboard);
        }
        else if (data === 'daily_gift') {
            const now = Date.now();
            const oneDay = 24 * 60 * 60 * 1000;
            if (now - users[chatId].lastDaily < oneDay) {
                await sendMessage(chatId, `⏳ لقد استلمت هديتك اليومية مسبقاً! عُد بعد 24 ساعة.`);
            } else {
                users[chatId].lastDaily = now;
                users[chatId].points += 20;
                await sendMessage(chatId, `🎉 مبروك يا غالي! حصلت على هديتك اليومية *20 نقطة* 🪙.\nرصيدك: ${users[chatId].points} نقطة.`);
            }
        }
        else if (data === 'games_menu') {
            const gamesText = `🎮 **قسم الألعاب والتحديات:**\nاجمع النقاط لطلب خدمات المتجر!`;
            const gamesKeyboard = {
                inline_keyboard: [
                    [{ text: '❌ ⭕ لعبة اكس أو (تحدي الذكاء)', callback_data: 'play_xo' }],
                    [{ text: '🔮 لعبة التوقعات (اختر رقم 1 إلى 7)', callback_data: 'play_guess' }],
                    [{ text: '🎡 عجلة الحظ (مرة كل 24 ساعة)', callback_data: 'lucky_wheel' }],
                    [{ text: '⬅️ رجوع للقائمة الرئيسية', callback_data: 'main_menu' }]
                ]
            };
            await editMessageText(chatId, messageId, gamesText, gamesKeyboard);
        }
        else if (data === 'play_xo') {
            const outcomes = ['win', 'lose', 'draw'];
            const result = outcomes[Math.floor(Math.random() * outcomes.length)];

            if (result === 'win') {
                users[chatId].points += 15;
                await sendMessage(chatId, `❌ ⭕ فزت على الذكاء الاصطناعي بذكاء!\n+15 نقطة 🪙 (رصيدك: ${users[chatId].points})`);
            } else if (result === 'draw') {
                users[chatId].points += 8;
                await sendMessage(chatId, `❌ ⭕ تعادل مثير مع البوت!\n+8 نقاط 🪙 (رصيدك: ${users[chatId].points})`);
            } else {
                await sendMessage(chatId, `❌ ⭕ هاردلك، هزمك الذكاء الاصطناعي هذه المرة! حاول مرة أخرى.`);
            }
        }
        else if (data === 'play_guess') {
            users[chatId].gameMode = 'guessing';
            users[chatId].targetNum = Math.floor(Math.random() * 7) + 1;
            await sendMessage(chatId, `🔮 **لعبة التوقعات الذكية:**\nتم تلخبط وتغيير الأرقام عشوائياً!\nأرسل الآن في الشات **رقماً من 1 إلى 7** لتربح 15 نقطة! 🎯`);
        }
        else if (data === 'lucky_wheel') {
            const now = Date.now();
            const oneDay = 24 * 60 * 60 * 1000;
            if (now - users[chatId].lastWheel < oneDay) {
                await sendMessage(chatId, `⏳ لقد استخدمت عجلة الحظ اليوم! مسموح لك مرة واحدة كل 24 ساعة.`);
            } else {
                users[chatId].lastWheel = now;
                const prize = Math.floor(Math.random() * 40) + 10;
                users[chatId].points += prize;
                await sendMessage(chatId, `🎡 دَارَت عجلة الحظ وربحت: *${prize} نقطة* 🪙!\nرصيدك الإجمالي: ${users[chatId].points} نقطة.`);
            }
        }
        else if (data === 'services_menu') {
            const servText = `📦 **قسم المتجر وخدمات الدعم:**\nاختر المنصة المطلوبة:`;
            const servKeyboard = {
                inline_keyboard: [
                    [{ text: '🎵 خدمات تيك توك', callback_data: 'platform_tiktok' }],
                    [{ text: '📺 خدمات يوتيوب', callback_data: 'platform_youtube' }],
                    [{ text: '📸 خدمات انستقرام', callback_data: 'platform_insta' }],
                    [{ text: '⬅️ رجوع للقائمة الرئيسية', callback_data: 'main_menu' }]
                ]
            };
            await editMessageText(chatId, messageId, servText, servKeyboard);
        }

        // --- تيك توك ---
        else if (data === 'platform_tiktok') {
            const kb = {
                inline_keyboard: [
                    [{ text: '🆓 خدمة مجانية: تكبيس لايف (10 شيرات)', callback_data: 'free_tk_live' }],
                    [{ text: '🆓 خدمة مجانية: لايكات مقطع تيك توك', callback_data: 'free_tk_like' }],
                    [{ text: '👥 متابعين تيك توك', callback_data: 'tk_followers' }],
                    [{ text: '👁️ مشاهدات وتفاعلات تيك توك', callback_data: 'tk_views' }],
                    [{ text: '⬅️ رجوع للمتجر', callback_data: 'services_menu' }]
                ]
            };
            await editMessageText(chatId, messageId, `🎵 **قسم تيك توك:**\nاختر نوع الخدمة:`, kb);
        }
        else if (data === 'tk_followers') {
            const kb = {
                inline_keyboard: [
                    [{ text: '👤 10 إلى 50 متابع (السعر: 90 نقطة)', callback_data: 'pay_tk_f1' }],
                    [{ text: '👤 50 إلى 100 متابع (السعر: 180 نقطة)', callback_data: 'pay_tk_f2' }],
                    [{ text: '👤 100 إلى 200 متابع (السعر: 320 نقطة)', callback_data: 'pay_tk_f3' }],
                    [{ text: '⬅️ رجوع', callback_data: 'platform_tiktok' }]
                ]
            };
            await editMessageText(chatId, messageId, `👥 **باقات متابعين تيك توك:**\nرصيدك: ${users[chatId].points} نقطة`, kb);
        }
        else if (data === 'tk_views') {
            const kb = {
                inline_keyboard: [
                    [{ text: '📊 100 إلى 1000 مشاهدة (السعر: 80 نقطة)', callback_data: 'pay_tk_v1' }],
                    [{ text: '📊 1000 إلى 10000 مشاهدة (السعر: 300 نقطة)', callback_data: 'pay_tk_v2' }],
                    [{ text: '⬅️ رجوع', callback_data: 'platform_tiktok' }]
                ]
            };
            await editMessageText(chatId, messageId, `👁️ **باقات مشاهدات وتفاعلات تيك توك:**\nرصيدك: ${users[chatId].points} نقطة`, kb);
        }

        // --- يوتيوب ---
        else if (data === 'platform_youtube') {
            const kb = {
                inline_keyboard: [
                    [{ text: '🆓 خدمة مجانية: تكبيس وتفاعلات لايف يوتيوب', callback_data: 'free_yt_live' }],
                    [{ text: '🆓 خدمة مجانية: لايكات فيديو يوتيوب', callback_data: 'free_yt_like' }],
                    [{ text: '👥 مشتركين يوتيوب', callback_data: 'yt_followers' }],
                    [{ text: '👁️ مشاهدات يوتيوب', callback_data: 'yt_views' }],
                    [{ text: '⬅️ رجوع للمتجر', callback_data: 'services_menu' }]
                ]
            };
            await editMessageText(chatId, messageId, `📺 **قسم يوتيوب:**\nاختر نوع الخدمة:`, kb);
        }
        else if (data === 'yt_followers') {
            const kb = {
                inline_keyboard: [
                    [{ text: '👤 10 إلى 50 مشترك (السعر: 110 نقطة)', callback_data: 'pay_yt_f1' }],
                    [{ text: '👤 50 إلى 100 مشترك (السعر: 220 نقطة)', callback_data: 'pay_yt_f2' }],
                    [{ text: '👤 100 إلى 200 مشترك (السعر: 400 نقطة)', callback_data: 'pay_yt_f3' }],
                    [{ text: '⬅️ رجوع', callback_data: 'platform_youtube' }]
                ]
            };
            await editMessageText(chatId, messageId, `👥 **باقات مشتركين يوتيوب:**\nرصيدك: ${users[chatId].points} نقطة`, kb);
        }
        else if (data === 'yt_views') {
            const kb = {
                inline_keyboard: [
                    [{ text: '📊 100 إلى 1000 مشاهدة (السعر: 90 نقطة)', callback_data: 'pay_yt_v1' }],
                    [{ text: '📊 1000 إلى 10000 مشاهدة (السعر: 350 نقطة)', callback_data: 'pay_yt_v2' }],
                    [{ text: '⬅️ رجوع', callback_data: 'platform_youtube' }]
                ]
            };
            await editMessageText(chatId, messageId, `👁️ **باقات مشاهدات يوتيوب:**\nرصيدك: ${users[chatId].points} نقطة`, kb);
        }

        // --- انستقرام ---
        else if (data === 'platform_insta') {
            const kb = {
                inline_keyboard: [
                    [{ text: '🆓 خدمة مجانية: تفاعلات لايف انستقرام', callback_data: 'free_in_live' }],
                    [{ text: '🆓 خدمة مجانية: لايكات ريلز/منشور انستا', callback_data: 'free_in_like' }],
                    [{ text: '👥 متابعين انستقرام', callback_data: 'in_followers' }],
                    [{ text: '👁️ مشاهدات وتفاعلات انستقرام', callback_data: 'in_views' }],
                    [{ text: '⬅️ رجوع للمتجر', callback_data: 'services_menu' }]
                ]
            };
            await editMessageText(chatId, messageId, `📸 **قسم انستقرام:**\nاختر نوع الخدمة:`, kb);
        }
        else if (data === 'in_followers') {
            const kb = {
                inline_keyboard: [
                    [{ text: '👤 10 إلى 50 متابع (السعر: 100 نقطة)', callback_data: 'pay_in_f1' }],
                    [{ text: '👤 50 إلى 100 متابع (السعر: 200 نقطة)', callback_data: 'pay_in_f2' }],
                    [{ text: '👤 100 إلى 200 متابع (السعر: 360 نقطة)', callback_data: 'pay_in_f3' }],
                    [{ text: '⬅️ رجوع', callback_data: 'platform_insta' }]
                ]
            };
            await editMessageText(chatId, messageId, `👥 **باقات متابعين انستقرام:**\nرصيدك: ${users[chatId].points} نقطة`, kb);
        }
        else if (data === 'in_views') {
            const kb = {
                inline_keyboard: [
                    [{ text: '📊 100 إلى 1000 مشاهدة (السعر: 85 نقطة)', callback_data: 'pay_in_v1' }],
                    [{ text: '📊 1000 إلى 10000 مشاهدة (السعر: 320 نقطة)', callback_data: 'pay_in_v2' }],
                    [{ text: '⬅️ رجوع', callback_data: 'platform_insta' }]
                ]
            };
            await editMessageText(chatId, messageId, `👁️ **باقات مشاهدات انستقرام:**\nرصيدك: ${users[chatId].points} نقطة`, kb);
        }

        // --- معالجة الطلبات ---
        else if (data.startsWith('free_')) {
            users[chatId].ordersCount += 1;
            const orderId = 'FREE-' + Math.floor(100000 + Math.random() * 900000);
            users[chatId].lastOrder = orderId;
            await sendMessage(chatId, `✅ **تم تنفيذ الخدمة المجانية بنجاح!**\n📌 رقم الطلب: \`${orderId}\`\nجاري التنفيذ الفوري 🚀\n🤍`);
        }
        else if (data.startsWith('pay_')) {
            let cost = 90;
            if (data.includes('_f2')) cost = 180;
            if (data.includes('_f3')) cost = 320;
            if (data.includes('_v2')) cost = 300;
            if (data.includes('_f1')) cost = 90;
            if (data.includes('yt_f1')) cost = 110;
            if (data.includes('yt_f2')) cost = 220;
            if (data.includes('yt_f3')) cost = 400;
            if (data.includes('yt_v1')) cost = 90;
            if (data.includes('yt_v2')) cost = 350;
            if (data.includes('in_f1')) cost = 100;
            if (data.includes('in_f2')) cost = 200;
            if (data.includes('in_f3')) cost = 360;
            if (data.includes('in_v1')) cost = 85;
            if (data.includes('in_v2')) cost = 320;

            if (users[chatId].points < cost) {
                await sendMessage(chatId, `❌ **عذراً، رصيدك غير كافٍ!**\nلديك *${users[chatId].points} نقطة* فقط وتحتاج إلى *${cost} نقطة*.\nاجمع النقاط من الألعاب أو الهدية اليومية! 🪙`);
            } else {
                users[chatId].points -= cost;
                users[chatId].ordersCount += 1;
                const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
                users[chatId].lastOrder = orderId;

                await sendMessage(chatId, `✅ **تم خصم ${cost} نقطة وقبول طلبك بنجاح!**\n\n📌 رقم طلبك للتتبع: \`${orderId}\`\nرصيدك المتبقي: *${users[chatId].points} نقطة* 🪙\nجاري التنفيذ... 🚀\n🤍`);
            }
        }
        else if (data === 'my_account') {
            const accText = `👤 **معلومات حسابك:**\n\n` +
                `🪙 النقاط المتوفرة: *${users[chatId].points} نقطة*\n` +
                `📦 عدد الطلبات الكلي: *${users[chatId].ordersCount} طلب*\n` +
                `🏷️ المعرف: \`${chatId}\``;
            
            const accKeyboard = {
                inline_keyboard: [
                    [{ text: '⬅️ رجوع للقائمة الرئيسية', callback_data: 'main_menu' }]
                ]
            };
            await editMessageText(chatId, messageId, accText, accKeyboard);
        }
        else if (data === 'track_order') {
            if (!users[chatId].lastOrder) {
                await sendMessage(chatId, `⚠️ ليس لديك أي طلبات سابقة لتتبعها!`);
            } else {
                await sendMessage(chatId, `📌 **تتبع الطلب الأخير:**\nرقم طلبك: \`${users[chatId].lastOrder}\`\nحالة الطلب: جاري التنفيذ بنجاح 🚀\n🤍`);
            }
        }
        else if (data === 'support') {
            await sendMessage(chatId, `🛠️ **الدعم الفني والخدمات:**\n👤 @abod097644`);
        }
    }

    res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
