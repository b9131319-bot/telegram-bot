const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

const TOKEN = '8875290524:AAFYRFTuHXH4mcSn6q4v7I9V7YRFrDtSeHg';
const ADMIN_CHAT_ID = '8266396167'; // ⚠️ معرف الآدي الخاص بك كأدمن
const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;
const BOT_USERNAME = 'abod_store_bot'; // ⚠️ ضع يوزر بوتك هنا بدقة (بدون علامة @)

const users = {};    // بيانات المستخدمين
const giftCodes = {}; // تخزين روابط/كوبونات النقاط النشطة

async function sendMessage(chatId, text, replyMarkup = null, replyToMessageId = null) {
    try {
        const payload = {
            chat_id: chatId,
            text: text,
            parse_mode: 'Markdown'
        };
        if (replyMarkup) {
            payload.reply_markup = replyMarkup;
        }
        if (replyToMessageId) {
            payload.reply_to_message_id = replyToMessageId;
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

function getServiceNiceName(data) {
    const names = {
        'free_tk_live': 'خدمة مجانية: تكبيس لايف تيك توك (10 شيرات)',
        'free_tk_like': 'خدمة مجانية: لايكات مقطع تيك توك',
        'pay_tk_f1': 'متابعين تيك توك (10 إلى 50 متابع)',
        'pay_tk_f2': 'متابعين تيك توك (50 إلى 100 متابع)',
        'pay_tk_f3': 'متابعين تيك توك (100 إلى 200 متابع)',
        'pay_tk_v1': 'مشاهدات وتفاعلات تيك توك (100 إلى 1000 مشاهدة)',
        'pay_tk_v2': 'مشاهدات وتفاعلات تيك توك (1000 إلى 10000 مشاهدة)',
        'free_yt_live': 'خدمة مجانية: تفاعلات لايف يوتيوب',
        'free_yt_like': 'خدمة مجانية: لايكات فيديو يوتيوب',
        'pay_yt_f1': 'مشتركين يوتيوب (10 إلى 50 مشترك)',
        'pay_yt_f2': 'مشتركين يوتيوب (50 إلى 100 مشترك)',
        'pay_yt_f3': 'مشتركين يوتيوب (100 إلى 200 مشترك)',
        'pay_yt_v1': 'مشاهدات يوتيوب (100 إلى 1000 مشاهدة)',
        'pay_yt_v2': 'مشاهدات يوتيوب (1000 إلى 10000 مشاهدة)',
        'free_in_live': 'خدمة مجانية: تفاعلات لايف انستقرام',
        'free_in_like': 'خدمة مجانية: لايكات ريلز/منشور انستا',
        'pay_in_f1': 'متابعين انستقرام (10 إلى 50 متابع)',
        'pay_in_f2': 'متابعين انستقرام (50 إلى 100 متابع)',
        'pay_in_f3': 'متابعين انستقرام (100 إلى 200 متابع)',
        'pay_in_v1': 'مشاهدات انستقرام (100 إلى 1000 مشاهدة)',
        'pay_in_v2': 'مشاهدات انستقرام (1000 إلى 10000 مشاهدة)',
        'pay_tw_f1': 'متابعين تويتش (10 إلى 50 متابع)',
        'pay_tw_f2': 'متابعين تويتش (50 إلى 100 متابع)',
        'pay_tw_v1': 'مشاهدات بث تويتش (100 إلى 500 مشاهدة)',
        'pay_store_create': 'خدمة إنشاء متجر متكامل'
    };
    return names[data] || data;
}

app.post(`/webhook/${TOKEN}`, async (req, res) => {
    try {
        const update = req.body;

        if (update.message) {
            const chatId = update.message.chat.id;
            const text = update.message.text;
            const userName = update.message.from.first_name || 'مستخدم';
            const userUsername = update.message.from.username ? `@${update.message.from.username}` : 'لا يوجد';

            if (!users[chatId]) {
                users[chatId] = {
                    name: userName,
                    username: userUsername,
                    points: 0,
                    ordersCount: 0,
                    lastDaily: 0,
                    lastWheel: 0,
                    lastMemory: 0,
                    lastBoxes: 0,
                    lastShapes: 0,
                    lastOrder: null,
                    waitingForInput: null,
                    waitingForGiftCreation: false,
                    waitingForBroadcast: false
                };
            } else {
                users[chatId].name = userName;
                users[chatId].username = userUsername;
            }

            // --- إذا كان الأدمن يرسل رسالة الإذاعة للجميع ---
            if (chatId.toString() === ADMIN_CHAT_ID.toString() && users[chatId].waitingForBroadcast) {
                users[chatId].waitingForBroadcast = false;
                const broadcastText = text;
                const allUserIds = Object.keys(users);
                let successCount = 0;

                for (const uid of allUserIds) {
                    try {
                        await sendMessage(uid, `📢 **رسالة من الإدارة:**\n\n${broadcastText}`);
                        successCount++;
                    } catch (e) {}
                }

                await sendMessage(ADMIN_CHAT_ID, `✅ **تم إرسال الإذاعة بنجاح!**\nتمت الإرسال إلى *${successCount}* مستخدم.`);
                return res.sendStatus(200);
            }

            // إذا كان الأدمن يكتب تفاصيل الهدية (النقاط + المدة)
            if (chatId.toString() === ADMIN_CHAT_ID.toString() && users[chatId].waitingForGiftCreation) {
                users[chatId].waitingForGiftCreation = false;
                const parts = text.split(' ');
                const pointsAmount = parseInt(parts[0]);
                const hoursDuration = parseInt(parts[1]) || 24;

                if (isNaN(pointsAmount) || pointsAmount <= 0) {
                    await sendMessage(chatId, `❌ **خطأ!** يرجى إرسال الصيغة الصحيحة:\n\`النقاط الساعات\`\nمثال: \`100 24\``);
                    return res.sendStatus(200);
                }

                const codeId = 'GIFT-' + Math.floor(100000 + Math.random() * 900000);
                const expiresAt = Date.now() + (hoursDuration * 60 * 60 * 1000);

                giftCodes[codeId] = {
                    points: pointsAmount,
                    expiresAt: expiresAt,
                    usedBy: []
                };

                const giftLink = `https://t.me/${BOT_USERNAME}?start=${codeId}`;

                await sendMessage(chatId, `✅ **تم إنشاء رابط النقاط الأزرق بنجاح!**\n\n🎁 النقاط: *${pointsAmount} نقطة*\n⏳ المدة: *${hoursDuration} ساعة*\n🔗 انسد الرابط التالي وانشره:\n${giftLink}`);
                return res.sendStatus(200);
            }

            // استقبال الدخول عبر رابط الهدية الأزرق
            if (text && text.startsWith('/start ')) {
                const startPayload = text.split(' ')[1];

                if (startPayload && giftCodes[startPayload]) {
                    const gift = giftCodes[startPayload];
                    const now = Date.now();

                    if (now > gift.expiresAt) {
                        await sendMessage(chatId, `❌ **عذراً، انتهت صلاحية رابط الهدية هذا! لقد انتهى وقت استخدامه.**`);
                        return res.sendStatus(200);
                    }

                    if (gift.usedBy.includes(chatId)) {
                        await sendMessage(chatId, `⚠️ **لقد قمت باستلام هذه الهدية مسبقاً ولا يمكنك استخدامها مرتين!**`);
                        return res.sendStatus(200);
                    }

                    // حساب الوقت المتبقي بالساعات لعرضه للمستخدم
                    const remainingHours = Math.ceil((gift.expiresAt - now) / (1000 * 60 * 60));

                    gift.usedBy.push(chatId);
                    users[chatId].points += gift.points;

                    await sendMessage(chatId, `🎉 **مبروك يا غالي! جاك هدية من الادمن 🤍**\n\n🎁 القيمة: **${gift.points} نقطة** 🪙\n⏳ ملاحظة: لقد استخدتم الرابط بنجاح وكان متبقي على انتهاء صلاحيته **${remainingHours} ساعة**. \n\nرصيدك الحالي: *${users[chatId].points} نقطة*.`, {
                        inline_keyboard: [[{ text: '⬅️ فتح القائمة الرئيسية', callback_data: 'main_menu' }]]
                    });
                    return res.sendStatus(200);
                }
            }

            // تفعيل الرد (Reply) من الأدمن للعميل
            if (chatId.toString() === ADMIN_CHAT_ID.toString() && update.message.reply_to_message) {
                const repliedMessage = update.message.reply_to_message;
                const repliedText = repliedMessage.text || '';

                const idMatch = repliedText.match(/معرف العميل \(ID\):\s*`(\d+)`/) || repliedText.match(/tg:\/\/user\?id=(\d+)/);
                const orderIdMatch = repliedText.match(/رقم الطلب:\s*`([A-Z0-9-]+)`/);

                if (idMatch && idMatch[1]) {
                    const targetUserChatId = idMatch[1];
                    const orderIdStr = orderIdMatch ? orderIdMatch[1] : 'غير معروف';

                    await sendMessage(targetUserChatId, `💬 **رد من إدارة المتجر بخصوص طلبك (${orderIdStr}):**\n\n${text}`);
                    await sendMessage(ADMIN_CHAT_ID, `✅ تم إرسال الرد إلى العميل بنجاح.`);
                }
                return res.sendStatus(200);
            }

            if (text) {
                if (users[chatId].waitingForInput) {
                    const pendingService = users[chatId].waitingForInput;
                    
                    if (text.length < 3 || (!text.includes('http') && !text.includes('@') && !text.includes('www.'))) {
                        await sendMessage(chatId, `❌ **الرابط أو اسم المستخدم غير صحيح!**\nيرجى إرسال رابط صحيح (يبدأ بـ http أو www) أو اسم مستخدم صحيح يحتوي على (@):`);
                        return res.sendStatus(200);
                    }

                    const targetInput = text;
                    users[chatId].waitingForInput = null;

                    let cost = 0;
                    const data = pendingService;

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
                        if (data.includes('tw_f1')) cost = 95;
                        if (data.includes('tw_f2')) cost = 190;
                        if (data.includes('tw_v1')) cost = 120;
                        if (data === 'pay_store_create') cost = 1000;

                        if (users[chatId].points < cost) {
                            await sendMessage(chatId, `❌ **عذراً، رصيدك غير كافٍ!**\nلديك *${users[chatId].points} نقطة* فقط وتحتاج إلى *${cost} نقطة*.`);
                            return res.sendStatus(200);
                        }
                        users[chatId].points -= cost;
                    }

                    users[chatId].ordersCount += 1;
                    const orderId = (data.startsWith('free_') ? 'FREE-' : 'ORD-') + Math.floor(100000 + Math.random() * 900000);
                    users[chatId].lastOrder = orderId;
                    const niceServiceName = getServiceNiceName(data);

                    await sendMessage(chatId, `✔️ **تم التحقق من الرابط / اسم المستخدم بنجاح!**`);

                    const adminMsg = `🚨 **طلب جديد وصل للبوت!**\n\n` +
                        `👤 اسم العميل: [${userName}](tg://user?id=${chatId})\n` +
                        `🏷️ معرف العميل (ID): \`${chatId}\`\n` +
                        `🪪 أسم المستخدم: \`${userUsername}\`\n` +
                        `📦 نوع الطلب: ${niceServiceName}\n` +
                        `🔗 الرابط / اسم المستخدم: \`${targetInput}\`\n` +
                        `📌 رقم الطلب: \`${orderId}\`\n` +
                        `🪙 التكلفة: ${cost} نقطة`;
                    
                    const adminKeyboard = {
                        inline_keyboard: [
                            [
                                { text: '✅ تم إتمام طلبك بنجاح', callback_data: `admin_done_${chatId}_${orderId}` },
                                { text: '❌ لم يتم اكتمال طلبك', callback_data: `admin_fail_${chatId}_${orderId}` }
                            ]
                        ]
                    };

                    await sendMessage(ADMIN_CHAT_ID, adminMsg, adminKeyboard);

                    await sendMessage(chatId, `✅ **تم قبول طلبك بنجاح يا غالي!**\n\n📦 الخدمة: ${niceServiceName}\n🔗 الرابط المرسل: \`${targetInput}\`\n📌 رقم طلبك للتتبع: \`${orderId}\`\n${cost > 0 ? `تم خصم *${cost} نقطة* من رصيدك.\nرصيدك المتبقي: *${users[chatId].points} نقطة* 🪙\n` : ''}جاري التنفيذ... 🚀\n🤍`, {
                        inline_keyboard: [[{ text: '⬅️ العودة للقائمة الرئيسية', callback_data: 'main_menu' }]]
                    });
                    return res.sendStatus(200);
                }

                if (text === '/start') {
                    const menuText = `🎛️ **القائمة الرئيسية:**\nلديك حالياً: *${users[chatId].points} نقطة* 🪙\n\n🌹 منور المتجر يا غالي إذا عجبك لاتنسانا من دعمك 🤍✨`;
                    
                    let keyboardRows = [
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
                    ];

                    if (chatId.toString() === ADMIN_CHAT_ID.toString()) {
                        keyboardRows.push([{ text: '📊 لوحة تحكم الأدمن (المستخدمين والروابط والإذاعة)', callback_data: 'admin_panel' }]);
                    }

                    const menuKeyboard = { inline_keyboard: keyboardRows };
                    await sendMessage(chatId, menuText, menuKeyboard);
                    return res.sendStatus(200);
                }
            }
        } 
        else if (update.callback_query) {
            const callbackQuery = update.callback_query;
            const chatId = callbackQuery.message.chat.id;
            const messageId = callbackQuery.message.message_id;
            const data = callbackQuery.data;

            if (!users[chatId]) {
                users[chatId] = { name: 'مستخدم', username: 'لا يوجد', points: 0, ordersCount: 0, lastDaily: 0, lastWheel: 0, lastMemory: 0, lastBoxes: 0, lastShapes: 0, lastOrder: null, waitingForInput: null, waitingForGiftCreation: false, waitingForBroadcast: false };
            }

            if (data === 'check_subscription') {
                const menuText = `🎛️ **القائمة الرئيسية:**\nلديك حالياً: *${users[chatId].points} نقطة* 🪙\n\n🌹 منور المتجر يا غالي إذا عجبك لاتنسانا من دعمك 🤍✨`;
                
                let keyboardRows = [
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
                ];

                if (chatId.toString() === ADMIN_CHAT_ID.toString()) {
                    keyboardRows.push([{ text: '📊 لوحة تحكم الأدمن (المستخدمين والروابط والإذاعة)', callback_data: 'admin_panel' }]);
                }

                await editMessageText(chatId, messageId, menuText, { inline_keyboard: keyboardRows });
                await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, { callback_query_id: callbackQuery.id });
                return res.sendStatus(200);
            }

            if (chatId.toString() === ADMIN_CHAT_ID.toString() && data === 'admin_panel') {
                const adminKeyboard = {
                    inline_keyboard: [
                        [
                            { text: '📊 عرض المستخدمين', callback_data: 'admin_users_list' },
                            { text: '🎁 رابط نقاط أزرق', callback_data: 'admin_create_gift' }
                        ],
                        [
                            { text: '📢 إذاعة للجميع', callback_data: 'admin_broadcast' }
                        ],
                        [{ text: '⬅️ العودة للقائمة الرئيسية', callback_data: 'main_menu' }]
                    ]
                };
                await editMessageText(chatId, messageId, `🛠️ **لوحة تحكم الأدمن:**`, adminKeyboard);
                await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, { callback_query_id: callbackQuery.id });
                return res.sendStatus(200);
            }

            if (chatId.toString() === ADMIN_CHAT_ID.toString() && data === 'admin_broadcast') {
                users[chatId].waitingForBroadcast = true;
                await sendMessage(chatId, `📢 **إذاعة عامة لجميع المستخدمين:**\n\nأرسل الآن في الشات الرسالة التي تريد إرسالها لكل من دخل البوت:`);
                await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, { callback_query_id: callbackQuery.id });
                return res.sendStatus(200);
            }

            if (chatId.toString() === ADMIN_CHAT_ID.toString() && data === 'admin_create_gift') {
                users[chatId].waitingForGiftCreation = true;
                await sendMessage(chatId, `🎁 **إنشاء رابط نقاط أزرق جديد:**\n\nأرسل الآن في الشات عدد النقاط والمدة بالساعات بهذا الشكل:\n\`النقاط الساعات\`\n\n*مثال:* \`100 24\``);
                await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, { callback_query_id: callbackQuery.id });
                return res.sendStatus(200);
            }

            if (chatId.toString() === ADMIN_CHAT_ID.toString() && data === 'admin_users_list') {
                const allUserIds = Object.keys(users);
                let adminPanelText = `🛠️ **قائمة كافة المستخدمين المسجلين (${allUserIds.length}):**\n\n`;
                
                allUserIds.forEach((id, index) => {
                    const u = users[id];
                    adminPanelText += `${index + 1}. [${u.name}](tg://user?id=${id}) | ID: \`${id}\` | اليوزر: \`${u.username}\` | النقاط: ${u.points}\n`;
                });

                if (adminPanelText.length > 4000) {
                    adminPanelText = adminPanelText.substring(0, 3900) + "\n\n... (القائمة طويلة جداً)";
                }

                await sendMessage(chatId, adminPanelText);
                await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, { callback_query_id: callbackQuery.id });
                return res.sendStatus(200);
            }

            if (chatId.toString() === ADMIN_CHAT_ID.toString() && (data.startsWith('admin_done_') || data.startsWith('admin_fail_'))) {
                const parts = data.split('_');
                const action = parts[1];
                const targetUserChatId = parts[2];
                const orderIdStr = parts[3];

                if (action === 'done') {
                    await sendMessage(targetUserChatId, `🎉 **تم إتمام طلبك بنجاح!**\n\n📌 رقم الطلب: \`${orderIdStr}\`\nشكراً لاستخدامك متجرنا 🤍✨`);
                    await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, {
                        callback_query_id: callbackQuery.id,
                        text: '✅ تم إرسال إشعار اكتمال الطلب للعميل بنجاح!',
                        show_alert: false
                    });
                    await editMessageText(chatId, messageId, callbackQuery.message.text + `\n\n🟢 **حالة الطلب:** تم الإتمام بنجاح ✅`);
                } else if (action === 'fail') {
                    await sendMessage(targetUserChatId, `❌ **عذراً، لم يتم اكتمال طلبك.**\n\n📌 رقم الطلب: \`${orderIdStr}\`\nيرجى التواصل مع الدعم الفني لمعرفة السبب: @abod097644`);
                    await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, {
                        callback_query_id: callbackQuery.id,
                        text: '❌ تم إرسال إشعار عدم اكتمال الطلب للعميل!',
                        show_alert: false
                    });
                    await editMessageText(chatId, messageId, callbackQuery.message.text + `\n\n🔴 **حالة الطلب:** لم يتم الإتمام ❌`);
                }
                return res.sendStatus(200);
            }

            const now = Date.now();
            const oneDay = 24 * 60 * 60 * 1000;

            if (data === 'main_menu') {
                users[chatId].waitingForInput = null;
                users[chatId].waitingForGiftCreation = false;
                users[chatId].waitingForBroadcast = false;
                const menuText = `🎛️ **القائمة الرئيسية:**\nلديك حالياً: *${users[chatId].points} نقطة* 🪙\n\n🌹 منور المتجر يا غالي إذا عجبك لاتنسانا من دعمك 🤍✨`;
                
                let keyboardRows = [
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
                ];

                if (chatId.toString() === ADMIN_CHAT_ID.toString()) {
                    keyboardRows.push([{ text: '📊 لوحة تحكم الأدمن (المستخدمين والروابط والإذاعة)', callback_data: 'admin_panel' }]);
                }

                const menuKeyboard = { inline_keyboard: keyboardRows };
                await editMessageText(chatId, messageId, menuText, menuKeyboard);
            }
            else if (data === 'daily_gift') {
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
                users[chatId].waitingForInput = null;
                const gamesText = `🎮 **قسم الألعاب والتحديات:**\nكل لعبة متاحة (مرة واحدة كل 24 ساعة):`;
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
            else if (data === 'play_memory') {
                if (now - users[chatId].lastMemory < oneDay) {
                    await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, {
                        callback_query_id: callbackQuery.id,
                        text: '⏳ لقد لعبت "تذكر الرمز" اليوم! مسموح مرة كل 24 ساعة.',
                        show_alert: true
                    });
                    return res.sendStatus(200);
                }

                const codes = ['73', '48', '91', '25', '64'];
                const correctCode = codes[Math.floor(Math.random() * codes.length)];
                
                const wrongOptions = ['19', '82', '37', '56', '90'];
                let opt1 = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
                let opt2 = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
                while(opt1 === correctCode) opt1 = '12';
                while(opt2 === correctCode || opt2 === opt1) opt2 = '88';

                const options = [correctCode, opt1, opt2].sort(() => Math.random() - 0.5);

                await editMessageText(chatId, messageId, `🧠 **تذكر الرمز السريع!**\n\nالرمز هو: \` ${correctCode} \`\n*(سيختفي سريعاً... جهز تركيزك!)* ⏳`);

                setTimeout(async () => {
                    const memKeyboard = {
                        inline_keyboard: [
                            [
                                { text: options[0], callback_data: `mem_${options[0]}_${correctCode}` },
                                { text: options[1], callback_data: `mem_${options[1]}_${correctCode}` },
                                { text: options[2], callback_data: `mem_${options[2]}_${correctCode}` }
                            ],
                            [{ text: '⬅️ رجوع للألعاب', callback_data: 'games_menu' }]
                        ]
                    };
                    await editMessageText(chatId, messageId, `🎯 **انتهى الوقت! اختر الرمز الصحيح الذي ظهر لك قبل قليل:**`, memKeyboard);
                }, 1500);
            }
            else if (data.startsWith('mem_')) {
                users[chatId].lastMemory = now;
                const parts = data.split('_');
                const chosen = parts[1];
                const correct = parts[2];

                if (chosen === correct) {
                    users[chatId].points += 25;
                    await editMessageText(chatId, messageId, `🎉 **كفووو يا بطل!**\nاخترت الرمز الصحيح (\`${correct}\`) بدقة تامة!\n+25 نقطة أضيفت لرصيدك 🪙 (رصيدك الحالي: ${users[chatId].points})\n\n⏳ *لقد استنفدت محاولتك لهذه اللعبة، ننتظرك غداً!*`, {
                        inline_keyboard: [
                            [{ text: '⬅️ رجوع للألعاب', callback_data: 'games_menu' }]
                        ]
                    });
                } else {
                    await editMessageText(chatId, messageId, `❌ **هاردلك!**\nاخترت (${chosen}) بينما الرمز الصحيح كان (\`${correct}\`).\nرصيدك الحالي: ${users[chatId].points} نقطة\n\n⏳ *لقد استنفدت محاولتك لهذه اللعبة، ننتظرك غداً!*`, {
                        inline_keyboard: [
                            [{ text: '⬅️ رجوع للألعاب', callback_data: 'games_menu' }]
                        ]
                    });
                }
            }
            else if (data === 'play_boxes') {
                if (now - users[chatId].lastBoxes < oneDay) {
                    await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, {
                        callback_query_id: callbackQuery.id,
                        text: '⏳ لقد لعبت "الصناديق" اليوم! مسموح مرة كل 24 ساعة.',
                        show_alert: true
                    });
                    return res.sendStatus(200);
                }

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
                users[chatId].lastBoxes = now;
                const chosenBox = parseInt(data.split('_')[1]);
                const emptyBox = Math.floor(Math.random() * 3);

                if (chosenBox === emptyBox) {
                    await editMessageText(chatId, messageId, `❌ **معوض خير خسرت!**\nالصندوق الذي اخترته كان فارغاً.\n\nرصيدك الحالي: ${users[chatId].points} نقطة 🪙\n\n⏳ *لقد استنفدت محاولتك اليومية لهذه اللعبة.*`, {
                        inline_keyboard: [
                            [{ text: '⬅️ رجوع للألعاب', callback_data: 'games_menu' }]
                        ]
                    });
                } else {
                    const wonPoints = Math.floor(Math.random() * 50) + 1;
                    users[chatId].points += wonPoints;
                    await editMessageText(chatId, messageId, `🎉 **مبروك يا غالي!**\nفتحت صندوقاً مليئاً بالنقاط وربحت **${wonPoints} نقطة** 🪙!\n\nرصيدك الجديد: ${users[chatId].points} نقطة.\n\n⏳ *لقد استنفدت محاولتك اليومية لهذه اللعبة.*`, {
                        inline_keyboard: [
                            [{ text: '⬅️ رجوع للألعاب', callback_data: 'games_menu' }]
                        ]
                    });
                }
            }
            else if (data === 'play_shapes') {
                if (now - users[chatId].lastShapes < oneDay) {
                    await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, {
                        callback_query_id: callbackQuery.id,
                        text: '⏳ لقد لعبت "الأشكال المختلفة" اليوم! مسموح مرة كل 24 ساعة.',
                        show_alert: true
                    });
                    return res.sendStatus(200);
                }

                const allSets = [
                    ['🍎', '🍊', '🍋', '🍌', '🍉'],
                    ['🐶', '🐱', '🐭', '🐹', '🐰'],
                    ['⚽', '🏀', '🏈', '⚾', '🎾'],
                    ['🚗', '🚕', '🚙', '🚌', '🚎'],
                    ['⌚', '📱', '💻', '⌨️', '📷'],
                    ['❤️', '💙', '💚', '💛', '💜'],
                    ['🚀', '🛸', '🛰️', '🪐', '⭐'],
                    ['⚡', '🔥', '💧', '❄️', '🌪️']
                ];

                const randomSet = allSets[Math.floor(Math.random() * allSets.length)];
                const baseShape = randomSet[Math.floor(Math.random() * randomSet.length)];
                
                let differentShape = randomSet[Math.floor(Math.random() * randomSet.length)];
                while(differentShape === baseShape) {
                    differentShape = randomSet[Math.floor(Math.random() * randomSet.length)];
                }

                const correctIndex = Math.floor(Math.random() * 4);
                users[chatId].currentShapeCorrect = correctIndex;

                let row = [];
                for (let i = 0; i < 4; i++) {
                    let displayChar = (i === correctIndex) ? differentShape : baseShape;
                    row.push({ text: displayChar, callback_data: `shape_${i}` });
                }

                const shapeKeyboard = {
                    inline_keyboard: [
                        row,
                        [{ text: '⬅️ إلغاء', callback_data: 'games_menu' }]
                    ]
                };
                await editMessageText(chatId, messageId, `⏱️ **لعبة الأشكال المختلفة العشوائية!**\nأمامك 4 أشكال، اختر الشكل **المختلف** بسرعة خلال **3 ثوانٍ**!`, shapeKeyboard);
            }
            else if (data.startsWith('shape_')) {
                users[chatId].lastShapes = now;
                const choice = parseInt(data.split('_')[1]);
                const correctIndex = users[chatId].currentShapeCorrect !== undefined ? users[chatId].currentShapeCorrect : 0;

                if (choice === correctIndex) {
                    users[chatId].points += 25;
                    await editMessageText(chatId, messageId, `✅ **إجابة صحيحة وفي الوقت المناسب!**\nحصلت على **25 نقطة** 🪙.\n\nرصيدك الحالي: ${users[chatId].points} نقطة.\n\n⏳ *لقد استنفدت محاولتك اليومية لهذه اللعبة.*`, {
                        inline_keyboard: [
                            [{ text: '⬅️ رجوع للألعاب', callback_data: 'games_menu' }]
                        ]
                    });
                } else {
                    await editMessageText(chatId, messageId, `❌ **إجابة خاطئة أو انتهى الوقت (3 ثوانٍ)!**\nهاردلك.\n\nرصيدك الحالي: ${users[chatId].points} نقطة.\n\n⏳ *لقد استنفدت محاولتك اليومية لهذه اللعبة.*`, {
                        inline_keyboard: [
                            [{ text: '⬅️ رجوع للألعاب', callback_data: 'games_menu' }]
                        ]
                    });
                }
            }
            else if (data === 'lucky_wheel') {
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
                users[chatId].waitingForInput = null;
                const servText = `📦 **قسم المتجر وخدمات الدعم:**\nاختر المنصة أو الخدمة المطلوبة:`;
                const servKeyboard = {
                    inline_keyboard: [
                        [{ text: '🎵 خدمات تيك توك', callback_data: 'platform_tiktok' }],
                        [{ text: '📺 خدمات يوتيوب', callback_data: 'platform_youtube' }],
                        [{ text: '📸 خدمات انستقرام', callback_data: 'platform_insta' }],
                        [{ text: '💜 خدمات تويتش (Twitch)', callback_data: 'platform_twitch' }],
                        [{ text: '🛒 إنشاء متجر متكامل (1000 نقطة)', callback_data: 'pay_store_create' }],
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

            // --- تويتش (Twitch) ---
            else if (data === 'platform_twitch') {
                const kb = {
                    inline_keyboard: [
                        [{ text: '👤 متابعين تويتش (10 إلى 50) - 95 نقطة', callback_data: 'pay_tw_f1' }],
                        [{ text: '👤 متابعين تويتش (50 إلى 100) - 190 نقطة', callback_data: 'pay_tw_f2' }],
                        [{ text: '👁️ مشاهدات بث تويتش (100 إلى 500) - 120 نقطة', callback_data: 'pay_tw_v1' }],
                        [{ text: '⬅️ رجوع للمتجر', callback_data: 'services_menu' }]
                    ]
                };
                await editMessageText(chatId, messageId, `💜 **قسم تويتش (Twitch):**\nاختر الباقة المطلوبة:`, kb);
            }

            else if (data.startsWith('free_') || data.startsWith('pay_')) {
                if (data.startsWith('pay_')) {
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
                    if (data.includes('tw_f1')) cost = 95;
                    if (data.includes('tw_f2')) cost = 190;
                    if (data.includes('tw_v1')) cost = 120;
                    if (data === 'pay_store_create') cost = 1000;

                    if (users[chatId].points < cost) {
                        await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, {
                            callback_query_id: callbackQuery.id,
                            text: `❌ رصيدك غير كافٍ! لديك ${users[chatId].points} نقطة وتحتاج إلى ${cost} نقطة.`,
                            show_alert: true
                        });
                        return res.sendStatus(200);
                    }
                }

                users[chatId].waitingForInput = data;

                await editMessageText(chatId, messageId, `🔗 **أرسل الآن في الشات رابط القناة/المتجر أو اسم المستخدم المطلوب:**\n*(مثال: رابط حسابك أو رابط البث أو منصتك مثل @username)*`, {
                    inline_keyboard: [
                        [{ text: '⬅️ إلغاء والعودة للمتجر', callback_data: 'services_menu' }]
                    ]
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
    } catch (err) {
        console.error('Webhook Error:', err);
        res.sendStatus(200);
    }
});

app.get('/', (req, res) => {
    res.send('Bot is running successfully!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
