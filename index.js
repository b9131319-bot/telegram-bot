const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

const TOKEN = '8875290524:AAFYRFTuHXH4mcSn6q4v7I9V7YRFrDtSeHg';
const ADMIN_CHAT_ID = '8266396167'; // ⚠️ معرف الآدي الخاص بك لاستلام طلبات العملاء
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
        const response = await axios.post(`${TELEGRAM_API}/sendMessage`, payload);
        return response.data.result.message_id;
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

async function deleteMessage(chatId, messageId) {
    try {
        await axios.post(`${TELEGRAM_API}/deleteMessage`, {
            chat_id: chatId,
            message_id: messageId
        });
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
                memoryAnswer: null,
                isRegistered: false
            };
        }

        if (text === '/start') {
            if (users[chatId].isRegistered) {
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
                await sendMessage(chatId, menuText, menuKeyboard);
                return res.sendStatus(200);
            }

            const subText = `🌹 أهلاً بك يا *${userName}* في بوت الخدمات المتكامل 🤍\n\n` +
                `⚠️ **ملاحظة هامة:** لكي تستخدم البوت، يرجى متابعة حساب التيك توك الخاص بنا لمرة واحدة فقط:\n` +
                `🔗 https://www.tiktok.com/@e..e233\n\n` +
                `🌸 بعد المتابعة، اضغط على زر **"تأكيد المتابعة ودخول البوت ✅"** بالأسفل لفتح البوت! ✨`;

            const subKeyboard = {
                inline_keyboard: [
                    [{ text: '🎵 اضغط هنا لمتابعة حساب التيك توك', url: 'https://www.tiktok.com/@e..e233' }],
                    [{ text: '✅ تأكيد المتابعة ودخول البوت', callback_data: 'check_subscription' }]
                ]
            };
            await sendMessage(chatId, subText, subKeyboard);
        }
    } 
    else if (update.callback_query) {
        const callbackQuery = update.callback_query;
        const chatId = callbackQuery.message.chat.id;
        const messageId = callbackQuery.message.message_id;
        const data = callbackQuery.data;
        const userFirstName = callbackQuery.from.first_name || 'مستخدم';

        if (!users[chatId]) {
            users[chatId] = { points: 20, ordersCount: 0, lastDaily: 0, lastWheel: 0, lastOrder: null, gameMode: null, targetNum: null, memoryAnswer: null, isRegistered: false };
        }

        if (data === 'check_subscription') {
            users[chatId].isRegistered = true;

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

        if (!users[chatId].isRegistered) {
            await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, {
                callback_query_id: callbackQuery.id,
                text: '⚠️ يجب متابعة حساب التيك توك وتأكيد المتابعة أولاً!',
                show_alert: true
            });
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
                await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, {
                    callback_query_id: callbackQuery.id,
                    text: '⏳ لقد استلمت هديتك اليومية مسبقاً! عُد بعد 24 ساعة.',
                    show_alert: true
                });
            } else {
                users[chatId].lastDaily = now;
                users[chatId].points += 20;
                await editMessageText(chatId, messageId, `🎉 **مبروك يا غالي!**\nحصلت على هديتك اليومية *20 نقطة* 🪙.\nرصيدك الحالي: ${users[chatId].points} نقطة.`, {
                    inline_keyboard: [[{ text: '⬅️ رجوع للقائمة الرئيسية', callback_data: 'main_menu' }]]
                });
            }
        }
        else if (data === 'games_menu') {
            const gamesText = `🎮 **قسم الألعاب والتحديات:**\nاجمع النقاط لطلب خدمات المتجر!`;
            const gamesKeyboard = {
                inline_keyboard: [
                    [{ text: '🧠 لعبة تذكر الرمز (اربح 25 نقطة)', callback_data: 'play_memory' }],
                    [{ text: '📦 لعبة الصناديق الحظ', callback_data: 'play_boxes' }],
                    [{ text: '🔲 لعبة الأشكال المختلفة (3 ثوانٍ)', callback_data: 'play_shapes' }],
                    [{ text: '🎡 عجلة الحظ (مرة كل 24 ساعة)', callback_data: 'lucky_wheel' }],
                    [{ text: '⬅️ رجوع للقائمة الرئيسية', callback_data: 'main_menu' }]
                ]
            };
            await editMessageText(chatId, messageId, gamesText, gamesKeyboard);
        }
        // --- لعبة تذكر الرمز (تم إصلاح بقاء الرمز وحذفه تماماً) ---
        else if (data === 'play_memory') {
            const codes = ['73', '48', '91', '25', '64'];
            const correctCode = codes[Math.floor(Math.random() * codes.length)];
            
            const wrongOptions = ['19', '82', '37', '56', '90'];
            let opt1 = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
            let opt2 = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
            while(opt1 === correctCode) opt1 = '12';
            while(opt2 === correctCode || opt2 === opt1) opt2 = '88';

            const options = [correctCode, opt1, opt2].sort(() => Math.random() - 0.5);

            // إظهار الرمز مؤقتاً في نفس الرسالة
            await editMessageText(chatId, messageId, `🧠 **تذكر الرمز السريع!**\n\nالرمز هو: \` ${correctCode} \`\n*(سيختفي بعد ثانيتين... جهز تركيزك!)* ⏳`);

            setTimeout(async () => {
                const memKeyboard = {
                    inline_keyboard: [
                        [
                            { text: options[0], callback_data: `mem_${options[0]}_${correctCode}` },
                            { text: options[1], callback_data: `mem_${options[1]}_${correctCode}` },
                            { text: options[2], callback_data: `mem_${options[2]}_${correctCode}` }
                        ],
                        [{ text: '⬅️ إلغاء', callback_data: 'games_menu' }]
                    ]
                };
                // تحديث نفس الرسالة واختفاء الرمز وعرض الخيارات فقط
                await editMessageText(chatId, messageId, `🎯 **انتهى الوقت! اختر الرمز الصحيح الذي ظهر لك قبل قليل:**`, memKeyboard);
            }, 2500);
        }
        else if (data.startsWith('mem_')) {
            const parts = data.split('_');
            const chosen = parts[1];
            const correct = parts[2];

            if (chosen === correct) {
                users[chatId].points += 25;
                await editMessageText(chatId, messageId, `🎉 **كفووو يا بطل!**\nاخترت الرمز الصحيح (\`${correct}\`) بدقة تامة!\n+25 نقطة أضيفت لرصيدك 🪙 (رصيدك الحالي: ${users[chatId].points})`, {
                    inline_keyboard: [
                        [{ text: '🔄 العب مجدداً', callback_data: 'play_memory' }],
                        [{ text: '⬅️ رجوع للألعاب', callback_data: 'games_menu' }]
                    ]
                });
            } else {
                await editMessageText(chatId, messageId, `❌ **هاردلك!**\nاخترت (${chosen}) بينما الرمز الصحيح كان (\`${correct}\`). حاول مرة أخرى!\n\nرصيدك الحالي: ${users[chatId].points} نقطة`, {
                    inline_keyboard: [
                        [{ text: '🔄 حاول مرة أخرى', callback_data: 'play_memory' }],
                        [{ text: '⬅️ رجوع للألعاب', callback_data: 'games_menu' }]
                    ]
                });
            }
        }
        // --- لعبة الصناديق (داخل نفس الرسالة لتوفير المساحة) ---
        else if (data === 'play_boxes') {
            const boxKeyboard = {
                inline_keyboard: [
                    [
                        { text: '🎁 صندوق 1', callback_data: 'box_0' },
                        { text: '🎁 صندوق 2', callback_data: 'box_1' },
                        { text: '🎁 صندوق 3', callback_data: 'box_2' }
                    ],
                    [{ text: '⬅️ رجوع', callback_data: 'games_menu' }]
                ]
            };
            await editMessageText(chatId, messageId, `📦 **لعبة الصناديق العشوائية!**\nأمامك 3 صناديق: صندوقين تحتويان على نقاط (بحد أقصى 50 نقطة) وصندوق فارغ.\nاختر صندوقاً بحذر:`, boxKeyboard);
        }
        else if (data.startsWith('box_')) {
            const chosenBox = parseInt(data.split('_')[1]);
            const emptyBox = Math.floor(Math.random() * 3);

            if (chosenBox === emptyBox) {
                await editMessageText(chatId, messageId, `❌ **معوض خير خسرت!**\nالصندوق الذي اخترته كان فارغاً.\n\nرصيدك الحالي: ${users[chatId].points} نقطة 🪙`, {
                    inline_keyboard: [
                        [{ text: '🔄 حاول مرة أخرى', callback_data: 'play_boxes' }],
                        [{ text: '⬅️ رجوع للألعاب', callback_data: 'games_menu' }]
                    ]
                });
            } else {
                const wonPoints = Math.floor(Math.random() * 50) + 1;
                users[chatId].points += wonPoints;
                await editMessageText(chatId, messageId, `🎉 **مبروك يا غالي!**\nفتحت صندوقاً مليئاً بالنقاط وربحت **${wonPoints} نقطة** 🪙!\n\nرصيدك الجديد: ${users[chatId].points} نقطة.`, {
                    inline_keyboard: [
                        [{ text: '🔄 العب مجدداً', callback_data: 'play_boxes' }],
                        [{ text: '⬅️ رجوع للألعاب', callback_data: 'games_menu' }]
                    ]
                });
            }
        }
        // --- لعبة الأشكال المختلفة (داخل نفس الرسالة لتوفير المساحة) ---
        else if (data === 'play_shapes') {
            const correctIndex = Math.floor(Math.random() * 4);
            users[chatId].currentShapeCorrect = correctIndex;

            const shapesList = ['⭐', '🟢', '🟥', '🔷'];
            const differentList = ['🌟', '🔵', '🟧', '🔶'];

            let row = [];
            for (let i = 0; i < 4; i++) {
                let displayChar = (i === correctIndex) ? differentList[i] : shapesList[i];
                row.push({ text: displayChar, callback_data: `shape_${i}` });
            }

            const shapeKeyboard = {
                inline_keyboard: [
                    row,
                    [{ text: '⬅️ إلغاء', callback_data: 'games_menu' }]
                ]
            };
            await editMessageText(chatId, messageId, `⏱️ **لعبة الأشكال المختلفة!**\nأمامك 4 أشكال، اختر الشكل **المختلف** بسرعة خلال **3 ثوانٍ**!`, shapeKeyboard);
        }
        else if (data.startsWith('shape_')) {
            const choice = parseInt(data.split('_')[1]);
            const correctIndex = users[chatId].currentShapeCorrect !== undefined ? users[chatId].currentShapeCorrect : 0;

            if (choice === correctIndex) {
                users[chatId].points += 25;
                await editMessageText(chatId, messageId, `✅ **إجابة صحيحة وفي الوقت المناسب!**\nحصلت على **25 نقطة** 🪙.\n\nرصيدك الحالي: ${users[chatId].points} نقطة.`, {
                    inline_keyboard: [
                        [{ text: '🔄 العب مجدداً', callback_data: 'play_shapes' }],
                        [{ text: '⬅️ رجوع للألعاب', callback_data: 'games_menu' }]
                    ]
                });
            } else {
                await editMessageText(chatId, messageId, `❌ **إجابة خاطئة أو انتهى الوقت (3 ثوانٍ)!**\nهاردلك، حاول مرة أخرى.\n\nرصيدك الحالي: ${users[chatId].points} نقطة.`, {
                    inline_keyboard: [
                        [{ text: '🔄 حاول مرة أخرى', callback_data: 'play_shapes' }],
                        [{ text: '⬅️ رجوع للألعاب', callback_data: 'games_menu' }]
                    ]
                });
            }
        }
        else if (data === 'lucky_wheel') {
            const now = Date.now();
            const oneDay = 24 * 60 * 60 * 1000;
            if (now - users[chatId].lastWheel < oneDay) {
                await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, {
                    callback_query_id: callbackQuery.id,
                    text: '⏳ لقد استخدمت عجلة الحظ اليوم! مسموح لك مرة واحدة كل 24 ساعة.',
                    show_alert: true
                });
            } else {
                users[chatId].lastWheel = now;
                const prize = Math.floor(Math.random() * 40) + 10;
                users[chatId].points += prize;
                await editMessageText(chatId, messageId, `🎡 **دَارَت عجلة الحظ وربحت:** *${prize} نقطة* 🪙!\nرصيدك الإجمالي: ${users[chatId].points} نقطة.`, {
                    inline_keyboard: [[{ text: '⬅️ رجوع للألعاب', callback_data: 'games_menu' }]]
                });
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

        // --- معالجة الطلبات وإرسال إشعار لك كأدمن ---
        else if (data.startsWith('free_') || data.startsWith('pay_')) {
            let cost = 0;

            if (data.startsWith('pay_')) {
                cost = 90;
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
                    await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, {
                        callback_query_id: callbackQuery.id,
                        text: `❌ رصيدك غير كافٍ! لديك ${users[chatId].points} نقطة وتحتاج إلى ${cost} نقطة.`,
                        show_alert: true
                    });
                    return res.sendStatus(200);
                }
                users[chatId].points -= cost;
            }

            users[chatId].ordersCount += 1;
            const orderId = (data.startsWith('free_') ? 'FREE-' : 'ORD-') + Math.floor(100000 + Math.random() * 900000);
            users[chatId].lastOrder = orderId;

            const adminMsg = `🚨 **طلب جديد وصل للبوت!**\n\n` +
                `👤 اسم العميل: ${userFirstName}\n` +
                `🏷️ معرف العميل (ID): \`${chatId}\`\n` +
                `📦 نوع الطلب: ${data}\n` +
                `📌 رقم الطلب: \`${orderId}\`\n` +
                `🪙 التكلفة: ${cost} نقطة`;
            
            await sendMessage(ADMIN_CHAT_ID, adminMsg);

            await editMessageText(chatId, messageId, `✅ **تم قبول طلبك بنجاح يا غالي!**\n\n📌 رقم طلبك للتتبع: \`${orderId}\`\n${cost > 0 ? `تم خصم *${cost} نقطة* من رصيدك.\nرصيدك المتبقي: *${users[chatId].points} نقطة* 🪙\n` : ''}جاري التنفيذ... 🚀\n🤍`, {
                inline_keyboard: [[{ text: '⬅️ رجوع للقائمة الرئيسية', callback_data: 'main_menu' }]]
            });
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
                await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, {
                    callback_query_id: callbackQuery.id,
                    text: '⚠️ ليس لديك أي طلبات سابقة لتتبعها!',
                    show_alert: true
                });
            } else {
                await editMessageText(chatId, messageId, `📌 **تتبع الطلب الأخير:**\nرقم طلبك: \`${users[chatId].lastOrder}\`\nحالة الطلب: جاري التنفيذ بنجاح 🚀\n🤍`, {
                    inline_keyboard: [[{ text: '⬅️ رجوع للقائمة الرئيسية', callback_data: 'main_menu' }]]
                });
            }
        }
        else if (data === 'support') {
            await editMessageText(chatId, messageId, `🛠️ **الدعم الفني والخدمات:**\n👤 @abod097644`, {
                inline_keyboard: [[{ text: '⬅️ رجوع للقائمة الرئيسية', callback_data: 'main_menu' }]]
            });
        }
    }

    res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
