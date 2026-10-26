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
                points: 20, // هدية ترحيبية
                ordersCount: 0,
                lastDaily: 0,
                lastOrder: null,
                gameMode: null,
                targetNum: null
            };
        }

        // إذا كان المستخدم داخل لعبة التوقعات ويخمن رقم
        if (users[chatId].gameMode === 'guessing') {
            const guessedNum = parseInt(text);
            if (isNaN(guessedNum)) {
                await sendMessage(chatId, `⚠️ يا غالي، اكتب رقماً صحيحاً بين 1 و 7 فقط!`);
            } else {
                if (guessedNum === users[chatId].targetNum) {
                    users[chatId].points += 30;
                    users[chatId].gameMode = null;
                    await sendMessage(chatId, `🎉 كفووو! اخترت الرقم الصحيح (${guessedNum}) وتوقعت بدقة!\n+30 نقطة 🪙 أضيفت لرصيدك (رصيد: ${users[chatId].points})`);
                } else {
                    users[chatId].gameMode = null;
                    await sendMessage(chatId, `❌ هاردلك! الرقم الصحيح كان (${users[chatId].targetNum}). حظاً أوفر في المرات القادمة!`);
                }
            }
            return res.sendStatus(200);
        }

        if (text === '/start') {
            const welcomeText = `أهلاً بك يا *${userName}* في بوت الخدمات المتكامل 🚀\n\n` +
                `⚠️ **شرط أساسي لعمل البوت:**\n` +
                `يرجى متابعة قناة التيك توك أولاً:\n🔗 https://www.tiktok.com/@e..e233\n\n` +
                `منور المتجر يا غالي إذا عجبك لاتنسانا من دعمك 🤍`;

            const keyboard = {
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
            await sendMessage(chatId, welcomeText, keyboard);
        }
    } 
    else if (update.callback_query) {
        const chatId = update.callback_query.message.chat.id;
        const data = update.callback_query.data;

        if (!users[chatId]) {
            users[chatId] = { points: 20, ordersCount: 0, lastDaily: 0, lastOrder: null, gameMode: null, targetNum: null };
        }

        if (data === 'main_menu') {
            const menuText = `🎛️ **القائمة الرئيسية:**\nلديك حالياً: *${users[chatId].points} نقطة* 🪙\n\nمنور المتجر يا غالي إذا عجبك لاتنسانا من دعمك 🤍`;
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
            await sendMessage(chatId, menuText, menuKeyboard);
        }
        else if (data === 'daily_gift') {
            const now = Date.now();
            const oneDay = 24 * 60 * 60 * 1000;
            if (now - users[chatId].lastDaily < oneDay) {
                await sendMessage(chatId, `⏳ لقد استلمت هدديتك اليومية مسبقاً! عُد بعد 24 ساعة.`);
            } else {
                users[chatId].lastDaily = now;
                users[chatId].points += 25;
                await sendMessage(chatId, `🎉 مبروك يا غالي! حصلت على هدديتك اليومية *25 نقطة* 🪙.\nرصيدك: ${users[chatId].points} نقطة.`);
            }
        }
        else if (data === 'games_menu') {
            const gamesText = `🎮 **قسم الألعاب والتحديات:**\nاجمع النقاط لطلب الخدمات من المتجر!`;
            const gamesKeyboard = {
                inline_keyboard: [
                    [{ text: '❌ ⭕ لعبة اكس أو (تحدي الذكاء الاصطناعي)', callback_data: 'play_xo' }],
                    [{ text: '🔮 لعبة التوقعات السريعة (اختر رقم من 1 إلى 7)', callback_data: 'play_guess' }],
                    [{ text: '🎡 عجلة الحظ الكبرى', callback_data: 'lucky_wheel' }],
                    [{ text: '⬅️ رجوع للقائمة الرئيسية', callback_data: 'main_menu' }]
                ]
            };
            await sendMessage(chatId, gamesText, gamesKeyboard);
        }
        else if (data === 'play_xo') {
            // محاكاة ذكاء اصطناعي حقيقي في لعبة XO
            const outcomes = ['win', 'lose', 'draw'];
            const result = outcomes[Math.floor(Math.random() * outcomes.length)];

            if (result === 'win') {
                users[chatId].points += 40;
                await sendMessage(chatId, `❌ ⭕ **لعبة اكس أو:**\nلعبت بذكاء خارق وهزمت الذكاء الاصطناعي بنجاح!\n🏆 +40 نقطة 🪙 (رصيدك الحالي: ${users[chatId].points})`);
            } else if (result === 'draw') {
                users[chatId].points += 15;
                await sendMessage(chatId, `❌ ⭕ **لعبة اكس أو:**\nمواجهة قوية انتهت بالتعادل العادل مع البوت!\n🤝 +15 نقطة 🪙 (رصيدك الحالي: ${users[chatId].points})`);
            } else {
                await sendMessage(chatId, `❌ ⭕ **لعبة اكس أو:**\nالذكاء الاصطناعي توقع حركتك وفاز عليك هذه المرة!\n💔 0 نقاط. حاول مرة أخرى واهزمه!`);
            }
        }
        else if (data === 'play_guess') {
            users[chatId].gameMode = 'guessing';
            users[chatId].targetNum = Math.floor(Math.random() * 7) + 1; // رقم عشوائي بين 1 و 7 يتغير ويلخبط
            await sendMessage(chatId, `🔮 **لعبة التوقعات الذكية:**\nتم تلخبط وتغيير الأرقام!\nأرسل الآن في الشات **رقماً واحداً من 1 إلى 7** لمعرفة إذا كان توقعك صحيحاً وتربح 30 نقطة! 🎯`);
        }
        else if (data === 'lucky_wheel') {
            const prize = Math.floor(Math.random() * 100) + 30;
            users[chatId].points += prize;
            await sendMessage(chatId, `🎡 دَارَت عجلة الحظ وربحت جائزة: *${prize} نقطة* 🪙!\nرصيدك الإجمالي: ${users[chatId].points} نقطة.`);
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
            await sendMessage(chatId, servText, servKeyboard);
        }

        // --- تيك توك ---
        else if (data === 'platform_tiktok') {
            const kb = {
                inline_keyboard: [
                    [{ text: '🆓 خدمة مجانية: تكبيس لايف (10 شيرات)', callback_data: 'free_tk_live' }],
                    [{ text: '🆓 خدمة مجانية: لايكات مقطع تيك توك', callback_data: 'free_tk_like' }],
                    [{ text: '👥 متابعين تيك توك (حسب النقاط)', callback_data: 'tk_followers' }],
                    [{ text: '👁️ مشاهدات وتفاعلات تيك توك', callback_data: 'tk_views' }],
                    [{ text: '⬅️ رجوع', callback_data: 'services_menu' }]
                ]
            };
            await sendMessage(chatId, `🎵 **قسم تيك توك:**\nاختر نوع الخدمة:`, kb);
        }
        else if (data === 'tk_followers') {
            const kb = {
                inline_keyboard: [
                    [{ text: '👤 10 إلى 50 متابع (السعر: 200 نقطة)', callback_data: 'pay_tk_f1' }],
                    [{ text: '👤 50 إلى 100 متابع (السعر: 400 نقطة)', callback_data: 'pay_tk_f2' }],
                    [{ text: '👤 100 إلى 200 متابع (السعر: 750 نقطة)', callback_data: 'pay_tk_f3' }],
                    [{ text: '⬅️ رجوع', callback_data: 'platform_tiktok' }]
                ]
            };
            await sendMessage(chatId, `👥 **باكات متابعين تيك توك:**\nرصيدك الحالي: ${users[chatId].points} نقطة`, kb);
        }
        else if (data === 'tk_views') {
            const kb = {
                inline_keyboard: [
                    [{ text: '📊 100 إلى 1000 مشاهدة (السعر: 150 نقطة)', callback_data: 'pay_tk_v1' }],
                    [{ text: '📊 1000 إلى 10000 مشاهدة (السعر: 600 نقطة)', callback_data: 'pay_tk_v2' }],
                    [{ text: '⬅️ رجوع', callback_data: 'platform_tiktok' }]
                ]
            };
            await sendMessage(chatId, `👁️ **باكات مشاهدات وتفاعلات تيك توك:**\nرصيدك الحالي: ${users[chatId].points} نقطة`, kb);
        }

        // --- يوتيوب ---
        else if (data === 'platform_youtube') {
            const kb = {
                inline_keyboard: [
                    [{ text: '🆓 خدمة مجانية: تكبيس وتفاعلات لايف يوتيوب', callback_data: 'free_yt_live' }],
                    [{ text: '🆓 خدمة مجانية: لايكات فيديو يوتيوب', callback_data: 'free_yt_like' }],
                    [{ text: '👥 مشتركين يوتيوب (حسب النقاط)', callback_data: 'yt_followers' }],
                    [{ text: '👁️ مشاهدات يوتيوب (حسب النقاط)', callback_data: 'yt_views' }],
                    [{ text: '⬅️ رجوع', callback_data: 'services_menu' }]
                ]
            };
            await sendMessage(chatId, `📺 **قسم يوتيوب:**\nاختر نوع الخدمة:`, kb);
        }
        else if (data === 'yt_followers') {
            const kb = {
                inline_keyboard: [
                    [{ text: '👤 10 إلى 50 مشترك (السعر: 250 نقطة)', callback_data: 'pay_yt_f1' }],
                    [{ text: '👤 50 إلى 100 مشترك (السعر: 500 نقطة)', callback_data: 'pay_yt_f2' }],
                    [{ text: '👤 100 إلى 200 مشترك (السعر: 900 نقطة)', callback_data: 'pay_yt_f3' }],
                    [{ text: '⬅️ رجوع', callback_data: 'platform_youtube' }]
                ]
            };
            await sendMessage(chatId, `👥 **باكات مشتركين يوتيوب:**\nرصيدك الحالي: ${users[chatId].points} نقطة`, kb);
        }
        else if (data === 'yt_views') {
            const kb = {
                inline_keyboard: [
                    [{ text: '📊 100 إلى 1000 مشاهدة (السعر: 200 نقطة)', callback_data: 'pay_yt_v1' }],
                    [{ text: '📊 1000 إلى 10000 مشاهدة (السعر: 700 نقطة)', callback_data: 'pay_yt_v2' }],
                    [{ text: '⬅️ رجوع', callback_data: 'platform_youtube' }]
                ]
            };
            await sendMessage(chatId, `👁️ **باكات مشاهدات يوتيوب:**\nرصيدك الحالي: ${users[chatId].points} نقطة`, kb);
        }

        // --- انستقرام ---
        else if (data === 'platform_insta') {
            const kb = {
                inline_keyboard: [
                    [{ text: '🆓 خدمة مجانية: تفاعلات لايف انستقرام', callback_data: 'free_in_live' }],
                    [{ text: '🆓 خدمة مجانية: لايكات ريلز/منشور انستا', callback_data: 'free_in_like' }],
                    [{ text: '👥 متابعين انستقرام (حسب النقاط)', callback_data: 'in_followers' }],
                    [{ text: '👁️ مشاهدات وتفاعلات انستقرام', callback_data: 'in_views' }],
                    [{ text: '⬅️ رجوع', callback_data: 'services_menu' }]
                ]
            };
            await sendMessage(chatId, `📸 **قسم انستقرام:**\nاختر نوع الخدمة:`, kb);
        }
        else if (data === 'in_followers') {
            const kb = {
                inline_keyboard: [
                    [{ text: '👤 10 إلى 50 متابع (السعر: 220 نقطة)', callback_data: 'pay_in_f1' }],
                    [{ text: '👤 50 إلى 100 متابع (السعر: 450 نقطة)', callback_data: 'pay_in_f2' }],
                    [{ text: '👤 100 إلى 200 متابع (السعر: 800 نقطة)', callback_data: 'pay_in_f3' }],
                    [{ text: '⬅️ رجوع', callback_data: 'platform_insta' }]
                ]
            };
            await sendMessage(chatId, `👥 **باكات متابعين انستقرام:**\nرصيدك الحالي: ${users[chatId].points} نقطة`, kb);
        }
        else if (data === 'in_views') {
            const kb = {
                inline_keyboard: [
                    [{ text: '📊 100 إلى 1000 مشاهدة (السعر: 180 نقطة)', callback_data: 'pay_in_v1' }],
                    [{ text: '📊 1000 إلى 10000 مشاهدة (السعر: 650 نقطة)', callback_data: 'pay_in_v2' }],
                    [{ text: '⬅️ رجوع', callback_data: 'platform_insta' }]
                ]
            };
            await sendMessage(chatId, `👁️ **باكات مشاهدات انستقرام:**\nرصيدك الحالي: ${users[chatId].points} نقطة`, kb);
        }

        // --- تنفيذ الطلبات المجانية والمدفوعة ---
        else if (data.startsWith('free_')) {
            users[chatId].ordersCount += 1;
            const orderId = 'FREE-' + Math.floor(100000 + Math.random() * 900000);
            users[chatId].lastOrder = orderId;
            await sendMessage(chatId, `✅ **تم تنفيذ الخدمة المجانية بنجاح!**\n📌 رقم الطلب: \`${orderId}\`\nسيتم البدء في التنفيذ الفوري 🚀\n🤍`);
        }
        else if (data.startsWith('pay_')) {
            let cost = 200;
            if (data.includes('_f2')) cost = 450;
            if (data.includes('_f3')) cost = 850;
            if (data.includes('_v2')) cost = 650;
            if (data.includes('_f1')) cost = 220;
            if (data.includes('yt_f1')) cost = 250;
            if (data.includes('yt_f2')) cost = 500;
            if (data.includes('yt_f3')) cost = 900;
            if (data.includes('yt_v1')) cost = 200;
            if (data.includes('yt_v2')) cost = 700;
            if (data.includes('tk_f1')) cost = 200;
            if (data.includes('tk_f2')) cost = 400;
            if (data.includes('tk_f3')) cost = 750;
            if (data.includes('tk_v1')) cost = 150;
            if (data.includes('tk_v2')) cost = 600;

            if (users[chatId].points < cost) {
                await sendMessage(chatId, `❌ **عذراً، رصيدك غير كافٍ!**\nلديك *${users[chatId].points} نقطة* فقط، وتحتاج إلى *${cost} نقطة*.\nاجمع النقاط عبر الألعاب أو الهدية اليومية واطلبها مرة أخرى! 🪙`);
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
            await sendMessage(chatId, accText, accKeyboard);
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
