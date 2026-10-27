Const express = require('express');
Const bodyParser = require('body-parser');
Const axios = require('axios');

Const app = express();
app.use(bodyParser.json());

Const TOKEN = '8875290524:AAFYRFTuHXH4mcSn6q4v7I9V7YRFrDtSeHg';
Const ADMIN_CHAT_ID = '8266396167'; // ⚠️ معرف الآدي الخاص بك لاستلام طلبات العملاء
Const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`;

Const users = {};

Async function sendMessage(chatId, text, replyMarkup = null, replyToMessageId = null) {
    Try {
        Const payload = {
            Chat_id: chatId,
            Text: text,
            Parse_mode: 'Markdown'
        };
        If (replyMarkup) {
            Payload.reply_markup = replyMarkup;
        }
        If (replyToMessageId) {
            Payload.reply_to_message_id = replyToMessageId;
        }
        Const response = await axios.post(`${TELEGRAM_API}/sendMessage`, payload);
        Return response.data.result.message_id;
    } catch (error) {
        Console.error('خطأ في إرسال الرسالة:', error.response?.data || error.message);
    }
}

Async function editMessageText(chatId, messageId, text, replyMarkup = null) {
    Try {
        Const payload = {
            Chat_id: chatId,
            Message_id: messageId,
            Text: text,
            Parse_mode: 'Markdown'
        };
        If (replyMarkup) {
            Payload.reply_markup = replyMarkup;
        }
        Await axios.post(`${TELEGRAM_API}/editMessageText`, payload);
    } catch (error) {}
}

// دالة تحويل كود الطلب إلى اسم عربي واضح
function getServiceNiceName(data) {
    Const names = {
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
        'pay_in_v2': 'مشاهدات انستقرام (1000 إلى 10000 مشاهدة)'
    };
    Return names[data] || data;
}

App.post(`/webhook/${TOKEN}`, async (req, res) => {
    Const update = req.body;

    If (update.message) {
        Const chatId = update.message.chat.id;
        Const text = update.message.text;
        Const userName = update.message.from.first_name || 'مستخدم';

        // --- تفعيل الرد (Reply) من الأدمن ليذهب للعميل مباشرة ---
        If (chatId.toString() === ADMIN_CHAT_ID.toString() && update.message.reply_to_message) {
            Const repliedMessage = update.message.reply_to_message;
            Const repliedText = repliedMessage.text || '';

            // استخراج الآيدي من رابط اسم العميل في الرسالة السابقة
            Const idMatch = repliedText.match(/tg:\/\/user\?id=(\d+)/);
            Const orderIdMatch = repliedText.match(/رقم الطلب:\s*`([A-Z0-9-]+)`/);

            If (idMatch && idMatch[1]) {
                Const targetUserChatId = idMatch[1];
                Const orderIdStr = orderIdMatch ? orderIdMatch[1] : 'غير معروف';

                Await sendMessage(targetUserChatId, `💬 **رد من إدارة المتجر بخصوص طلبك (${orderIdStr}):**\n\n${text}`);
                Await sendMessage(ADMIN_CHAT_ID, `✅ تم إرسال الرد إلى العميل بنجاح.`);
            }
            Return res.sendStatus(200);
        }

        If (text) {
            If (!users[chatId]) {
                Users[chatId] = {
                    Points: 20,
                    OrdersCount: 0,
                    LastDaily: 0,
                    LastWheel: 0,
                    LastMemory: 0,
                    LastBoxes: 0,
                    LastShapes: 0,
                    LastOrder: null,
                    IsRegistered: false,
                    WaitingForInput: null
                };
            }

            If (users[chatId].waitingForInput) {
                Const pendingService = users[chatId].waitingForInput;
                
                If (text.length < 3 || (!text.includes('http') && !text.includes('@') && !text.includes('www.'))) {
                    Await sendMessage(chatId, `❌ **الرابط أو اسم المستخدم غير صحيح!**\nيرجى إرسال رابط صحيح (يبدأ بـ http أو www) أو اسم مستخدم صحيح يحتوي على (@):`);
                    Return res.sendStatus(200);
                }

                Const targetInput = text;
                Users[chatId].waitingForInput = null;

                Let cost = 0;
                Const data = pendingService;

                If (data.startsWith('pay_')) {
                    Cost = 90;
                    If (data.includes('_f2')) cost = 180;
                    If (data.includes('_f3')) cost = 320;
                    If (data.includes('_v2')) cost = 300;
                    If (data.includes('_f1')) cost = 90;
                    If (data.includes('yt_f1')) cost = 110;
                    If (data.includes('yt_f2')) cost = 220;
                    If (data.includes('yt_f3')) cost = 400;
                    If (data.includes('yt_v1')) cost = 90;
                    If (data.includes('yt_v2')) cost = 350;
                    If (data.includes('in_f1')) cost = 100;
                    If (data.includes('in_f2')) cost = 200;
                    If (data.includes('in_f3')) cost = 360;
                    If (data.includes('in_v1')) cost = 85;
                    If (data.includes('in_v2')) cost = 320;

                    If (users[chatId].points < cost) {
                        Await sendMessage(chatId, `❌ **عذراً، رصيدك غير كافٍ!**\nلديك *${users[chatId].points} نقطة* فقط وتحتاج إلى *${cost} نقطة*.`);
                        Return res.sendStatus(200);
                    }
                    Users[chatId].points -= cost;
                }

                Users[chatId].ordersCount += 1;
                Const orderId = (data.startsWith('free_') ? 'FREE-' : 'ORD-') + Math.floor(100000 + Math.random() * 900000);
                Users[chatId].lastOrder = orderId;
                Const niceServiceName = getServiceNiceName(data);

                Await sendMessage(chatId, `✔️ **تم التحقق من الرابط / اسم المستخدم بنجاح!**`);

                // إشعار الأدمن مع جعل اسم العميل رابط مباشر يفتح حسابه بضغطة زر
                Const adminMsg = `🚨 **طلب جديد وصل للبوت!**\n\n` +
                    `👤 اسم العميل: [${userName}](tg://user?id=${chatId})\n` +
                    `📦 نوع الطلب: ${niceServiceName}\n` +
                    `🔗 الرابط / اسم المستخدم: \`${targetInput}\`\n` +
                    `📌 رقم الطلب: \`${orderId}\`\n` +
                    `🪙 التكلفة: ${cost} نقطة`;
                
                Await sendMessage(ADMIN_CHAT_ID, adminMsg);

                Await sendMessage(chatId, `✅ **تم قبول طلبك بنجاح يا غالي!**\n\n📦 الخدمة: ${niceServiceName}\n🔗 الرابط المرسل: \`${targetInput}\`\n📌 رقم طلبك للتتبع: \`${orderId}\`\n${cost > 0 ? `تم خصم *${cost} نقطة* من رصيدك.\nرصيدك المتبقي: *${users[chatId].points} نقطة* 🪙\n` : ''}جاري التنفيذ... 🚀\n🤍`, {
                    Inline_keyboard: [[{ text: '⬅️ العودة للقائمة الرئيسية', callback_data: 'main_menu' }]]
                });
                Return res.sendStatus(200);
            }

            If (text === '/start') {
                If (users[chatId].isRegistered) {
                    Const menuText = `🎛️ **القائمة الرئيسية:**\nلديك حالياً: *${users[chatId].points} نقطة* 🪙\n\n🌹 منور المتجر يا غالي إذا عجبك لاتنسانا من دعمك 🤍✨`;
                    Const menuKeyboard = {
                        Inline_keyboard: [
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
                    Await sendMessage(chatId, menuText, menuKeyboard);
                    Return res.sendStatus(200);
                }

                Const subText = `🌹 أهلاً بك يا *${userName}* في بوت الخدمات المتكامل 🤍\n\n` +
                    `⚠️ **ملاحظة هامة:** لكي تستخدم البوت، يرجى متابعة حساب التيك توك الخاص بنا لمرة واحدة فقط:\n` +
                    `🔗 https://www.tiktok.com/@e..e233\n\n` +
                    `🌸 بعد المتابعة، اضغط على زر **"تأكيد المتابعة ودخول البوت ✅"** بالأسفل لفتح البوت! ✨`;

                Const subKeyboard = {
                    Inline_keyboard: [
                        [{ text: '🎵 اضغط هنا لمتابعة حساب التيك توك', url: 'https://www.tiktok.com/@e..e233' }],
                        [{ text: '✅ تأكيد المتابعة ودخول البوت', callback_data: 'check_subscription' }]
                    ]
                };
                Await sendMessage(chatId, subText, subKeyboard);
            }
        }
    } 
    Else if (update.callback_query) {
        Const callbackQuery = update.callback_query;
        Const chatId = callbackQuery.message.chat.id;
        Const messageId = callbackQuery.message.message_id;
        Const data = callbackQuery.data;

        If (!users[chatId]) {
            Users[chatId] = { points: 20, ordersCount: 0, lastDaily: 0, lastWheel: 0, lastMemory: 0, lastBoxes: 0, lastShapes: 0, lastOrder: null, isRegistered: false, waitingForInput: null };
        }

        If (data === 'check_subscription') {
            Users[chatId].isRegistered = true;

            Const welcomeText = `🌹 منور المتجر يا غالي إذا عجبك لاتنسانا من دعمك 🤍✨\n\n` +
                `🎁 تم التحقق بنجاح وفتح جميع خدمات البوت والألعاب لك! اختر ما يناسبك من القائمة أدناه:`;

            Const mainKeyboard = {
                Inline_keyboard: [
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
            Await editMessageText(chatId, messageId, welcomeText, mainKeyboard);
            Return res.sendStatus(200);
        }

        If (!users[chatId].isRegistered) {
            Await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, {
                Callback_query_id: callbackQuery.id,
                Text: '⚠️ يجب متابعة حساب التيك توك وتأكيد المتابعة أولاً!',
                Show_alert: true
            });
            Return res.sendStatus(200);
        }

        Const now = Date.now();
        Const oneDay = 24 * 60 * 60 * 1000;

        If (data === 'main_menu') {
            Users[chatId].waitingForInput = null;
            Const menuText = `🎛️ **القائمة الرئيسية:**\nلديك حالياً: *${users[chatId].points} نقطة* 🪙\n\n🌹 منور المتجر يا غالي إذا عجبك لاتنسانا من دعمك 🤍✨`;
            Const menuKeyboard = {
                Inline_keyboard: [
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
            Await editMessageText(chatId, messageId, menuText, menuKeyboard);
        }
        Else if (data === 'daily_gift') {
            If (now - users[chatId].lastDaily < oneDay) {
                Await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, {
                    Callback_query_id: callbackQuery.id,
                    Text: '⏳ لقد استلمت هديتك اليومية مسبقاً! عُد بعد 24 ساعة.',
                    Show_alert: true
                });
            } else {
                Users[chatId].lastDaily = now;
                Users[chatId].points += 20;
                Await editMessageText(chatId, messageId, `🎉 **مبروك يا غالي!**\nحصلت على هديتك اليومية *20 نقطة* 🪙.\nرصيدك الحالي: ${users[chatId].points} نقطة.`, {
                    Inline_keyboard: [[{ text: '⬅️ رجوع للقائمة الرئيسية', callback_data: 'main_menu' }]]
                });
            }
        }
        Else if (data === 'games_menu') {
            Users[chatId].waitingForInput = null;
            Const gamesText = `🎮 **قسم الألعاب والتحديات:**\nكل لعبة متاحة (مرة واحدة كل 24 ساعة):`;
            Const gamesKeyboard = {
                Inline_keyboard: [
                    [{ text: '🧠 لعبة تذكر الرمز (اربح 25 نقطة)', callback_data: 'play_memory' }],
                    [{ text: '📦 لعبة الصناديق الحظ', callback_data: 'play_boxes' }],
                    [{ text: '🔲 لعبة الأشكال المختلفة (3 ثوانٍ)', callback_data: 'play_shapes' }],
                    [{ text: '🎡 عجلة الحظ (مرة كل 24 ساعة)', callback_data: 'lucky_wheel' }],
                    [{ text: '⬅️ رجوع للقائمة الرئيسية', callback_data: 'main_menu' }]
                ]
            };
            Await editMessageText(chatId, messageId, gamesText, gamesKeyboard);
        }
        Else if (data === 'play_memory') {
            If (now - users[chatId].lastMemory < oneDay) {
                Await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, {
                    Callback_query_id: callbackQuery.id,
                    Text: '⏳ لقد لعبت "تذكر الرمز" اليوم! مسموح مرة كل 24 ساعة.',
                    Show_alert: true
                });
                Return res.sendStatus(200);
            }

            Const codes = ['73', '48', '91', '25', '64'];
            Const correctCode = codes[Math.floor(Math.random() * codes.length)];
            
            Const wrongOptions = ['19', '82', '37', '56', '90'];
            Let opt1 = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
            Let opt2 = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
            While(opt1 === correctCode) opt1 = '12';
            While(opt2 === correctCode || opt2 === opt1) opt2 = '88';

            Const options = [correctCode, opt1, opt2].sort(() => Math.random() - 0.5);

            Await editMessageText(chatId, messageId, `🧠 **تذكر الرمز السريع!**\n\nالرمز هو: \` ${correctCode} \`\n*(سيختفي سريعاً... جهز تركيزك!)* ⏳`);

            SetTimeout(async () => {
                Const memKeyboard = {
                    Inline_keyboard: [
                        [
                            { text: options[0], callback_data: `mem_${options[0]}_${correctCode}` },
                            { text: options[1], callback_data: `mem_${options[1]}_${correctCode}` },
                            { text: options[2], callback_data: `mem_${options[2]}_${correctCode}` }
                        ],
                        [{ text: '⬅️ رجوع للألعاب', callback_data: 'games_menu' }]
                    ]
                };
                Await editMessageText(chatId, messageId, `🎯 **انتهى الوقت! اختر الرمز الصحيح الذي ظهر لك قبل قليل:**`, memKeyboard);
            }, 1500);
        }
        Else if (data.startsWith('mem_')) {
            Users[chatId].lastMemory = now;
            Const parts = data.split('_');
            Const chosen = parts[1];
            Const correct = parts[2];

            If (chosen === correct) {
                Users[chatId].points += 25;
                Await editMessageText(chatId, messageId, `🎉 **كفووو يا بطل!**\nاخترت الرمز الصحيح (\`${correct}\`) بدقة تامة!\n+25 نقطة أضيفت لرصيدك 🪙 (رصيدك الحالي: ${users[chatId].points})\n\n⏳ *لقد استنفدت محاولتك لهذه اللعبة، ننتظرك غداً!*`, {
                    Inline_keyboard: [
                        [{ text: '⬅️ رجوع للألعاب', callback_data: 'games_menu' }]
                    ]
                });
            } else {
                Await editMessageText(chatId, messageId, `❌ **هاردلك!**\nاخترت (${chosen}) بينما الرمز الصحيح كان (\`${correct}\`).\nرصيدك الحالي: ${users[chatId].points} نقطة\n\n⏳ *لقد استنفدت محاولتك لهذه اللعبة، ننتظرك غداً!*`, {
                    Inline_keyboard: [
                        [{ text: '⬅️ رجوع للألعاب', callback_data: 'games_menu' }]
                    ]
                });
            }
        }
        Else if (data === 'play_boxes') {
            If (now - users[chatId].lastBoxes < oneDay) {
                Await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, {
                    Callback_query_id: callbackQuery.id,
                    Text: '⏳ لقد لعبت "الصناديق" اليوم! مسموح مرة كل 24 ساعة.',
                    Show_alert: true
                });
                Return res.sendStatus(200);
            }

            Const boxKeyboard = {
                Inline_keyboard: [
                    [
                        { text: '🎁 صندوق 1', callback_data: 'box_0' },
                        { text: '🎁 صندوق 2', callback_data: 'box_1' },
                        { text: '🎁 صندوق 3', callback_data: 'box_2' }
                    ],
                    [{ text: '⬅️ رجوع', callback_data: 'games_menu' }]
                ]
            };
            Await editMessageText(chatId, messageId, `📦 **لعبة الصناديق العشوائية!**\nأمامك 3 صناديق: صندوقين تحتويان على نقاط (بحد أقصى 50 نقطة) وصندوق فارغ.\nاختر صندوقاً بحذر:`, boxKeyboard);
        }
        Else if (data.startsWith('box_')) {
            Users[chatId].lastBoxes = now;
            Const chosenBox = parseInt(data.split('_')[1]);
            Const emptyBox = Math.floor(Math.random() * 3);

            If (chosenBox === emptyBox) {
                Await editMessageText(chatId, messageId, `❌ **معوض خير خسرت!**\nالصندوق الذي اخترته كان فارغاً.\n\nرصيدك الحالي: ${users[chatId].points} نقطة 🪙\n\n⏳ *لقد استنفدت محاولتك اليومية لهذه اللعبة.*`, {
                    Inline_keyboard: [
                        [{ text: '⬅️ رجوع للألعاب', callback_data: 'games_menu' }]
                    ]
                });
            } else {
                Const wonPoints = Math.floor(Math.random() * 50) + 1;
                Users[chatId].points += wonPoints;
                Await editMessageText(chatId, messageId, `🎉 **مبروك يا غالي!**\nفتحت صندوقاً مليئاً بالنقاط وربحت **${wonPoints} نقطة** 🪙!\n\nرصيدك الجديد: ${users[chatId].points} نقطة.\n\n⏳ *لقد استنفدت محاولتك اليومية لهذه اللعبة.*`, {
                    Inline_keyboard: [
                        [{ text: '⬅️ رجوع للألعاب', callback_data: 'games_menu' }]
                    ]
                });
            }
        }
        Else if (data === 'play_shapes') {
            If (now - users[chatId].lastShapes < oneDay) {
                Await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, {
                    Callback_query_id: callbackQuery.id,
                    Text: '⏳ لقد لعبت "الأشكال المختلفة" اليوم! مسموح مرة كل 24 ساعة.',
                    Show_alert: true
                });
                Return res.sendStatus(200);
            }

            Const allSets = [
                ['🍎', '🍊', '🍋', '🍌', '🍉'],
                ['🐶', '🐱', '🐭', '🐹', '🐰'],
                ['⚽', '🏀', '🏈', '⚾', '🎾'],
                ['🚗', '🚕', '🚙', '🚌', '🚎'],
                ['⌚', '📱', '💻', '⌨️', '📷'],
                ['❤️', '💙', '💚', '💛', '💜'],
                ['🚀', '🛸', '🛰️', '🪐', '⭐'],
                ['⚡', '🔥', '💧', '❄️', '🌪️']
            ];

            Const randomSet = allSets[Math.floor(Math.random() * allSets.length)];
            Const baseShape = randomSet[Math.floor(Math.random() * randomSet.length)];
            
            Let differentShape = randomSet[Math.floor(Math.random() * randomSet.length)];
            While(differentShape === baseShape) {
                DifferentShape = randomSet[Math.floor(Math.random() * randomSet.length)];
            }

            Const correctIndex = Math.floor(Math.random() * 4);
            Users[chatId].currentShapeCorrect = correctIndex;

            Let row = [];
            For (let i = 0; i < 4; i++) {
                Let displayChar = (i === correctIndex) ? differentShape : baseShape;
                Row.push({ text: displayChar, callback_data: `shape_${i}` });
            }

            Const shapeKeyboard = {
                Inline_keyboard: [
                    Row,
                    [{ text: '⬅️ إلغاء', callback_data: 'games_menu' }]
                ]
            };
            Await editMessageText(chatId, messageId, `⏱️ **لعبة الأشكال المختلفة العشوائية!**\nأمامك 4 أشكال، اختر الشكل **المختلف** بسرعة خلال **3 ثوانٍ**!`, shapeKeyboard);
        }
        Else if (data.startsWith('shape_')) {
            Users[chatId].lastShapes = now;
            Const choice = parseInt(data.split('_')[1]);
            Const correctIndex = users[chatId].currentShapeCorrect !== undefined ? users[chatId].currentShapeCorrect : 0;

            If (choice === correctIndex) {
                Users[chatId].points += 25;
                Await editMessageText(chatId, messageId, `✅ **إجابة صحيحة وفي الوقت المناسب!**\nحصلت على **25 نقطة** 🪙.\n\nرصيدك الحالي: ${users[chatId].points} نقطة.\n\n⏳ *لقد استنفدت محاولتك اليومية لهذه اللعبة.*`, {
                    Inline_keyboard: [
                        [{ text: '⬅️ رجوع للألعاب', callback_data: 'games_menu' }]
                    ]
                });
            } else {
                Await editMessageText(chatId, messageId, `❌ **إجابة خاطئة أو انتهى الوقت (3 ثوانٍ)!**\nهاردلك.\n\nرصيدك الحالي: ${users[chatId].points} نقطة.\n\n⏳ *لقد استنفدت محاولتك اليومية لهذه اللعبة.*`, {
                    Inline_keyboard: [
                        [{ text: '⬅️ رجوع للألعاب', callback_data: 'games_menu' }]
                    ]
                });
            }
        }
        Else if (data === 'lucky_wheel') {
            If (now - users[chatId].lastWheel < oneDay) {
                Await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, {
                    Callback_query_id: callbackQuery.id,
                    Text: '⏳ لقد استخدمت عجلة الحظ اليوم! مسموح لك مرة واحدة كل 24 ساعة.',
                    Show_alert: true
                });
            } else {
                Users[chatId].lastWheel = now;
                Const prize = Math.floor(Math.random() * 40) + 10;
                Users[chatId].points += prize;
                Await editMessageText(chatId, messageId, `🎡 **دَارَت عجلة الحظ وربحت:** *${prize} نقطة* 🪙!\nرصيدك الإجمالي: ${users[chatId].points} نقطة.`, {
                    Inline_keyboard: [[{ text: '⬅️ رجوع للألعاب', callback_data: 'games_menu' }]]
                });
            }
        }
        Else if (data === 'services_menu') {
            Users[chatId].waitingForInput = null;
            Const servText = `📦 **قسم المتجر وخدمات الدعم:**\nاختر المنصة المطلوبة:`;
            Const servKeyboard = {
                Inline_keyboard: [
                    [{ text: '🎵 خدمات تيك توك', callback_data: 'platform_tiktok' }],
                    [{ text: '📺 خدمات يوتيوب', callback_data: 'platform_youtube' }],
                    [{ text: '📸 خدمات انستقرام', callback_data: 'platform_insta' }],
                    [{ text: '⬅️ رجوع للقائمة الرئيسية', callback_data: 'main_menu' }]
                ]
            };
            Await editMessageText(chatId, messageId, servText, servKeyboard);
        }

        // --- تيك توك ---
        Else if (data === 'platform_tiktok') {
            Const kb = {
                Inline_keyboard: [
                    [{ text: '🆓 خدمة مجانية: تكبيس لايف (10 شيرات)', callback_data: 'free_tk_live' }],
                    [{ text: '🆓 خدمة مجانية: لايكات مقطع تيك توك', callback_data: 'free_tk_like' }],
                    [{ text: '👥 متابعين تيك توك', callback_data: 'tk_followers' }],
                    [{ text: '👁️ مشاهدات وتفاعلات تيك توك', callback_data: 'tk_views' }],
                    [{ text: '⬅️ رجوع للمتجر', callback_data: 'services_menu' }]
                ]
            };
            Await editMessageText(chatId, messageId, `🎵 **قسم تيك توك:**\nاختر نوع الخدمة:`, kb);
        }
        Else if (data === 'tk_followers') {
            Const kb = {
                Inline_keyboard: [
                    [{ text: '👤 10 إلى 50 متابع (السعر: 90 نقطة)', callback_data: 'pay_tk_f1' }],
                    [{ text: '👤 50 إلى 100 متابع (السعر: 180 نقطة)', callback_data: 'pay_tk_f2' }],
                    [{ text: '👤 100 إلى 200 متابع (السعر: 320 نقطة)', callback_data: 'pay_tk_f3' }],
                    [{ text: '⬅️ رجوع', callback_data: 'platform_tiktok' }]
                ]
            };
            Await editMessageText(chatId, messageId, `👥 **باقات متابعين تيك توك:**\nرصيدك: ${users[chatId].points} نقطة`, kb);
        }
        Else if (data === 'tk_views') {
            Const kb = {
                Inline_keyboard: [
                    [{ text: '📊 100 إلى 1000 مشاهدة (السعر: 80 نقطة)', callback_data: 'pay_tk_v1' }],
                    [{ text: '📊 1000 إلى 10000 مشاهدة (السعر: 300 نقطة)', callback_data: 'pay_tk_v2' }],
                    [{ text: '⬅️ رجوع', callback_data: 'platform_tiktok' }]
                ]
            };
            Await editMessageText(chatId, messageId, `👁️ **باقات مشاهدات وتفاعلات تيك توك:**\nرصيدك: ${users[chatId].points} نقطة`, kb);
        }

        // --- يوتيوب ---
        Else if (data === 'platform_youtube') {
            Const kb = {
                Inline_keyboard: [
                    [{ text: '🆓 خدمة مجانية: تكبيس وتفاعلات لايف يوتيوب', callback_data: 'free_yt_live' }],
                    [{ text: '🆓 خدمة مجانية: لايكات فيديو يوتيوب', callback_data: 'free_yt_like' }],
                    [{ text: '👥 مشتركين يوتيوب', callback_data: 'yt_followers' }],
                    [{ text: '👁️ مشاهدات يوتيوب', callback_data: 'yt_views' }],
                    [{ text: '⬅️ رجوع للمتجر', callback_data: 'services_menu' }]
                ]
            };
            Await editMessageText(chatId, messageId, `📺 **قسم يوتيوب:**\nاختر نوع الخدمة:`, kb);
        }
        Else if (data === 'yt_followers') {
            Const kb = {
                Inline_keyboard: [
                    [{ text: '👤 10 إلى 50 مشترك (السعر: 110 نقطة)', callback_data: 'pay_yt_f1' }],
                    [{ text: '👤 50 إلى 100 مشترك (السعر: 220 نقطة)', callback_data: 'pay_yt_f2' }],
                    [{ text: '👤 100 إلى 200 مشترك (السعر: 400 نقطة)', callback_data: 'pay_yt_f3' }],
                    [{ text: '⬅️ رجوع', callback_data: 'platform_youtube' }]
                ]
            };
            Await editMessageText(chatId, messageId, `👥 **باقات مشتركين يوتيوب:**\nرصيدك: ${users[chatId].points} نقطة`, kb);
        }
        Else if (data === 'yt_views') {
            Const kb = {
                Inline_keyboard: [
                    [{ text: '📊 100 إلى 1000 مشاهدة (السعر: 90 نقطة)', callback_data: 'pay_yt_v1' }],
                    [{ text: '📊 1000 إلى 10000 مشاهدة (السعر: 350 نقطة)', callback_data: 'pay_yt_v2' }],
                    [{ text: '⬅️ رجوع', callback_data: 'platform_youtube' }]
                ]
            };
            Await editMessageText(chatId, messageId, `👁️ **باقات مشاهدات يوتيوب:**\nرصيدك: ${users[chatId].points} نقطة`, kb);
        }

        // --- انستقرام ---
        Else if (data === 'platform_insta') {
            Const kb = {
                Inline_keyboard: [
                    [{ text: '🆓 خدمة مجانية: تفاعلات لايف انستقرام', callback_data: 'free_in_live' }],
                    [{ text: '🆓 خدمة مجانية: لايكات ريلز/منشور انستا', callback_data: 'free_in_like' }],
                    [{ text: '👥 متابعين انستقرام', callback_data: 'in_followers' }],
                    [{ text: '👁️ مشاهدات وتفاعلات انستقرام', callback_data: 'in_views' }],
                    [{ text: '⬅️ رجوع للمتجر', callback_data: 'services_menu' }]
                ]
            };
            Await editMessageText(chatId, messageId, `📸 **قسم انستقرام:**\nاختر نوع الخدمة:`, kb);
        }
        Else if (data === 'in_followers') {
            Const kb = {
                Inline_keyboard: [
                    [{ text: '👤 10 إلى 50 متابع (السعر: 100 نقطة)', callback_data: 'pay_in_f1' }],
                    [{ text: '👤 50 إلى 100 متابع (السعر: 200 نقطة)', callback_data: 'pay_in_f2' }],
                    [{ text: '👤 100 إلى 200 متابع (السعر: 360 نقطة)', callback_data: 'pay_in_f3' }],
                    [{ text: '⬅️ رجوع', callback_data: 'platform_insta' }]
                ]
            };
            Await editMessageText(chatId, messageId, `👥 **باقات متابعين انستقرام:**\nرصيدك: ${users[chatId].points} نقطة`, kb);
        }
        Else if (data === 'in_views') {
            Const kb = {
                Inline_keyboard: [
                    [{ text: '📊 100 إلى 1000 مشاهدة (السعر: 85 نقطة)', callback_data: 'pay_in_v1' }],
                    [{ text: '📊 1000 إلى 10000 مشاهدة (السعر: 320 نقطة)', callback_data: 'pay_in_v2' }],
                    [{ text: '⬅️ رجوع', callback_data: 'platform_insta' }]
                ]
            };
            Await editMessageText(chatId, messageId, `👁️ **باقات مشاهدات انستقرام:**\nرصيدك: ${users[chatId].points} نقطة`, kb);
        }

        Else if (data.startsWith('free_') || data.startsWith('pay_')) {
            If (data.startsWith('pay_')) {
                Let cost = 90;
                If (data.includes('_f2')) cost = 180;
                If (data.includes('_f3')) cost = 320;
                If (data.includes('_v2')) cost = 300;
                If (data.includes('_f1')) cost = 90;
                If (data.includes('yt_f1')) cost = 110;
                If (data.includes('yt_f2')) cost = 220;
                If (data.includes('yt_f3')) cost = 400;
                If (data.includes('yt_v1')) cost = 90;
                If (data.includes('yt_v2')) cost = 350;
                If (data.includes('in_f1')) cost = 100;
                If (data.includes('in_f2')) cost = 200;
                If (data.includes('in_f3')) cost = 360;
                If (data.includes('in_v1')) cost = 85;
                If (data.includes('in_v2')) cost = 320;

                If (users[chatId].points < cost) {
                    Await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, {
                        Callback_query_id: callbackQuery.id,
                        Text: `❌ رصيدك غير كافٍ! لديك ${users[chatId].points} نقطة وتحتاج إلى ${cost} نقطة.`,
                        Show_alert: true
                    });
                    Return res.sendStatus(200);
                }
            }

            Users[chatId].waitingForInput = data;

            Await editMessageText(chatId, messageId, `🔗 **أرسل الآن في الشات رابط المقطع أو اسم المستخدم المطلوب للخدمة:**\n*(مثال: رابط الفيديو أو حسابك مثل @username)*`, {
                Inline_keyboard: [
                    [{ text: '⬅️ إلغاء والعودة للمتجر', callback_data: 'services_menu' }]
                ]
            });
        }
        Else if (data === 'my_account') {
            Const accText = `👤 **معلومات حسابك:**\n\n` +
                `🪙 النقاط المتوفرة: *${users[chatId].points} نقطة*\n` +
                `📦 عدد الطلبات الكلي: *${users[chatId].ordersCount} طلب*\n` +
                `🏷️ المعرف: \`${chatId}\``;
            
            Const accKeyboard = {
                Inline_keyboard: [
                    [{ text: '⬅️ رجوع للقائمة الرئيسية', callback_data: 'main_menu' }]
                ]
            };
            Await editMessageText(chatId, messageId, accText, accKeyboard);
        }
        Else if (data === 'track_order') {
            If (!users[chatId].lastOrder) {
                Await axios.post(`${TELEGRAM_API}/answerCallbackQuery`, {
                    Callback_query_id: callbackQuery.id,
                    Text: '⚠️ ليس لديك أي طلبات سابقة لتتبعها!',
                    Show_alert: true
                });
            } else {
                Await editMessageText(chatId, messageId, `📌 **تتبع الطلب الأخير:**\nرقم طلبك: \`${users[chatId].lastOrder}\`\nحالة الطلب: جاري التنفيذ بنجاح 🚀\n🤍`, {
                    Inline_keyboard: [[{ text: '⬅️ رجوع للقائمة الرئيسية', callback_data: 'main_menu' }]]
                });
            }
        }
        Else if (data === 'support') {
            Await editMessageText(chatId, messageId, `🛠️ **الدعم الفني والخدمات:**\n👤 @abod097644`, {
                Inline_keyboard: [[{ text: '⬅️ رجوع للقائمة الرئيسية', callback_data: 'main_menu' }]]
            });
        }
    }

    Res.sendStatus(200);
});

Const PORT = process.env.PORT || 3000;
App.listen(PORT, () => {
    Console.log(`Server is running on port ${PORT}`);
});
