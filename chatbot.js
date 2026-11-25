// Advanced Multilingual LinguaKids Chatbot - Supports Romanized Text & Cross-Language Questions
function createLinguaKidsChatbot(containerId, language) {
  const container = document.getElementById(containerId);

  container.innerHTML = `
    <div class="linguakids-chatbot">
      <div class="linguakids-chatbot-header">
        <i class="fas fa-robot"></i> LinguaKids Tutor (${getLanguageName(language)})
        <div class="chatbot-close" onclick="closeChatbot()">✕</div>
      </div>

      <div id="chatMessages" class="linguakids-chat-messages"></div>

      <div class="linguakids-chat-input-area">
        <input id="chatInput" type="text" placeholder="${getPlaceholder(language)}" class="linguakids-chat-input">
        <button id="sendBtn" class="linguakids-send-btn">
          <i class="fas fa-paper-plane"></i>
        </button>
      </div>
    </div>
  `;

  const messages = container.querySelector("#chatMessages");
  const input = container.querySelector("#chatInput");
  const sendBtn = container.querySelector("#sendBtn");

  // Helper function to get language display name
  function getLanguageName(lang) {
    const names = {
      'english': 'English',
      'hindi': 'हिंदी',
      'marathi': 'मराठी',
      'german': 'Deutsch',
      'chinese': '中文'
    };
    return names[lang] || lang;
  }

  // Helper function to get placeholder text
  function getPlaceholder(lang) {
    const placeholders = {
      'english': 'Ask something... (Type in any language!)',
      'hindi': 'कुछ पूछें... (English में भी लिख सकते हैं)',
      'marathi': 'काहीतरी विचारा... (English मध्ये पण लिहू शकता)',
      'german': 'Fragen Sie etwas...',
      'chinese': '问点什么...'
    };
    return placeholders[lang] || placeholders.english;
  }

  // Romanized Hindi to Hindi mapping (common words)
  const romanizedHindiMap = {
    'namaste': 'नमस्ते',
    'kaise': 'कैसे',
    'kya': 'क्या',
    'hai': 'है',
    'mera': 'मेरा',
    'tera': 'तेरा',
    'aapka': 'आपका',
    'tum': 'तुम',
    'main': 'मैं',
    'hum': 'हम',
    'aur': 'और',
    'nahi': 'नहीं',
    'haan': 'हाँ',
    'theek': 'ठीक',
    'acha': 'अच्छा',
    'accha': 'अच्छा',
    'shukriya': 'शुक्रिया',
    'dhanyavaad': 'धन्यवाद',
    'alvida': 'अलविदा',
    'phir': 'फिर',
    'kal': 'कल',
    'aaj': 'आज',
    'kab': 'कब',
    'kahan': 'कहाँ',
    'kyon': 'क्यों',
    'kitna': 'कितना',
    'kitne': 'कितने',
    'kaise ho': 'कैसे हो',
    'kya haal': 'क्या हाल',
    'theek hoon': 'ठीक हूँ',
    'byee': 'अलविदा',
    'mera naam': 'मेरा नाम',
    'aapka naam': 'आपका नाम',
    'kya kar rahe ho': 'क्या कर रहे हो',
    'mujhe sikhna hai': 'मुझे सीखना है',
    'hindi sikhni hai': 'हिंदी सीखनी है',
    'english sikhni hai': 'अंग्रेजी सीखनी है',
    'kaisa hai': 'कैसा है',
    'bahut accha': 'बहुत अच्छा',
    'maza aaya': 'मज़ा आया',
    'samajh gaya': 'समझ गया',
    'samajh gayi': 'समझ गई',
    'phir milenge': 'फिर मिलेंगे',
    'kal milte hain': 'कल मिलते हैं',
    'kitne baje': 'कितने बजे'
  };

  // Romanized Marathi to Marathi mapping (common words)
  const romanizedMarathiMap = {
    'namaskar': 'नमस्कार',
    'kase': 'कसे',
    'kay': 'काय',
    'ahe': 'आहे',
    'maza': 'माझं',
    'tujha': 'तुझं',
    'apan': 'आपण',
    'tumhi': 'तुम्ही',
    'mi': 'मी',
    'amhi': 'आम्ही',
    'aani': 'आणि',
    'nahi': 'नाही',
    'ho': 'हो',
    'chaan': 'छान',
    'masta': 'मस्त',
    'dhanyavad': 'धन्यवाद',
    'aabhari': 'आभारी',
    'pudhe': 'पुढे',
    'bhetu': 'भेटू',
    'aata': 'आता',
    'udya': 'उद्या',
    'kal': 'काल',
    'kevh': 'केव्हा',
    'kuth': 'कुठे',
    'kon': 'कोण',
    'kit': 'किती',
    'kase aahat': 'कसे आहात',
    'maza naam': 'माझं नाव',
    'tujha naam': 'तुझं नाव',
    'maja aala': 'मजा आला',
    'samajla': 'समजलं',
    'pudhe bhetu': 'पुढे भेटू'
  };

  // Language-specific responses organized by language
  const responses = {
    english: {
      greetings: [
        "Hello! How are you today? 🌟",
        "Hi there! Ready to learn something new? 📚",
        "Hey! I'm your tutor. How can I help? 🤗",
        "Hello! Let's learn something fun! 🎉",
        "How are you? What would you like to learn today? 😊"
      ],
      identity: [
        "I'm LinguaKids Tutor, your AI friend! 🤖",
        "Call me LinguaBot - your personal tutor! 📖",
        "I'm your AI tutor, always ready to help you learn! ✨",
        "I'm here to teach you English, Hindi, Marathi and other languages! 🌍"
      ],
      thanks: [
        "You're welcome! Have a great day! 🌈",
        "Happy to help! 😊",
        "My pleasure! Any more questions? 💫",
        "Glad I could help! 🙏"
      ],
      farewell: [
        "Goodbye! See you next time! 👋",
        "Come back soon! Keep learning! 📚",
        "Bye bye! Take care! ⭐",
        "Stay happy! See you again! 🌈"
      ],
      colors: [
        "Welcome to the world of colors! Red, yellow, green - these are all colors. What's your favorite color? 🎨",
        "Which color do you like? I love green - like trees and grass! 🌿",
        "Learning colors is fun! Blue sky, yellow sun, red apple! 🍎",
        "Did you know? Blue and yellow mixed together make green! 🎨"
      ],
      numbers: [
        "Let's count! One, two, three, four, five! 🔢",
        "How high can you count? I can count to 100! 💯",
        "Counting game: I say one, you say 1! Let's start! 🎮",
        "In English: one, two, three, four, five! 🇬🇧"
      ],
      animals: [
        "The animal world is fascinating! Dogs say 'woof', cats say 'meow'! 🐶🐱",
        "Which animal do you like? Elephants are big, lions are strong! 🦁",
        "Want to learn animal names? Dog, Cat, Elephant! 🐘",
        "Did you know? Cheetahs are the fastest animals in the world! 🐆"
      ],
      languages: [
        "I can teach many languages - English, Hindi, Marathi, German, and Chinese! 🌍",
        "Which language would you like to learn? I can help! 📚",
        "Ask in any language, I'll respond in the same language! 😊",
        "You ask in English, I answer in English. Ask in Hindi, I answer in Hindi! 🤗"
      ],
      name_inquiry: [
        "What's your name, my friend? 😊",
        "Please tell me your name! I'd love to know! 🤗",
        "What should I call you? Let's be friends! 🌟",
        "I'd like to know your name! Will you tell me? 🎈"
      ],
      name_response: [
        "That's a beautiful name! Nice to meet you! 🌈",
        "Wow! What a lovely name! 😍",
        "Great name! Now let's learn something! 📚",
        "Beautiful name! I really like it! 💖"
      ],
      default: [
        "Great question! Let's learn about it! 🤔",
        "Interesting question! Let me think... 💭",
        "Wow! You're so smart! Let's learn this! 🎓",
        "Cool question! Let me answer that! ✨",
        "You ask great questions! Let's explore! 🚀",
        "Good question! Let's talk about that! 💬"
      ]
    },
    hindi: {
      greetings: [
        "नमस्ते! कैसे हैं आप? 🌟",
        "हाय! क्या सीखना चाहोगे आज? 📚",
        "नमस्ते! मैं आपका ट्यूटर हूँ। कैसे मदद कर सकता हूँ? 🤗",
        "हेलो! चलो कुछ नया सीखें! 🎉",
        "आप कैसे हैं? मैं आपकी क्या मदद कर सकता हूँ? 😊"
      ],
      identity: [
        "मैं LinguaKids ट्यूटर हूँ, आपका AI दोस्त! 🤖",
        "मुझे LinguaBot बुलाओ - आपका अपना ट्यूटर! 📖",
        "मैं आपका AI ट्यूटर हूँ, सीखने में मदद के लिए हमेशा तैयार! ✨",
        "मैं यहाँ हूँ आपको अंग्रेजी, हिंदी और दूसरी भाषाएँ सिखाने के लिए! 🌍"
      ],
      thanks: [
        "शुक्रिया! आपका दिन शुभ हो! 🌈",
        "धन्यवाद! मदद करके खुशी हुई! 😊",
        "आपका बहुत-बहुत धन्यवाद! कोई और सवाल? 💫",
        "खुशी हुई आपकी मदद करके! 🙏"
      ],
      farewell: [
        "अलविदा! फिर मिलेंगे! 👋",
        "जल्दी वापस आना! सीखते रहो! 📚",
        "बाय बाय! तब तक के लिए! ⭐",
        "खुश रहो! फिर मिलेंगे! 🌈"
      ],
      colors: [
        "रंगों की दुनिया में आपका स्वागत है! लाल, पीला, हरा - ये सब रंग हैं। तुम्हारा पसंदीदा रंग कौन सा है? 🎨",
        "तुम्हें कौन सा रंग पसंद है? मुझे हरा बहुत पसंद है - जैसे पेड़ और घास! 🌿",
        "रंग सीखना मज़ेदार है! नीला आकाश, पीला सूरज, लाल सेब! 🍎",
        "क्या तुम जानते हो? नीले और पीले को मिलाने से हरा बनता है! 🎨"
      ],
      numbers: [
        "चलो गिनती सीखें! एक, दो, तीन, चार, पाँच! 🔢",
        "तुम कितनी गिनती जानते हो? मैं तो १०० तक गिन सकता हूँ! 💯",
        "गिनती खेल: मैं कहूँ एक, तुम कहो १! चलो शुरू करें! 🎮",
        "अंग्रेजी में गिनती: one, two, three, four, five! 🇬🇧"
      ],
      animals: [
        "जानवरों की दुनिया बहुत मज़ेदार है! कुत्ता 'भौं-भौं' करता है, बिल्ली 'म्याऊँ'! 🐶🐱",
        "तुम्हें कौन सा जानवर पसंद है? हाथी बहुत बड़ा और शेर बहुत ताकतवर! 🦁",
        "जानवरों के नाम अंग्रेजी में सीखना चाहोगे? Dog, Cat, Elephant! 🐘",
        "क्या तुम्हें पता है? चीते दुनिया के सबसे तेज़ जानवर हैं! 🐆"
      ],
      languages: [
        "मैं कई भाषाएँ सिखा सकता हूँ - हिंदी, मराठी, जर्मन, चीनी और अंग्रेजी! 🌍",
        "तुम कौन सी भाषा सीखना चाहोगे? मैं मदद कर सकता हूँ! 📚",
        "हिंदी में पूछो तो हिंदी में जवाब, अंग्रेजी में पूछो तो अंग्रेजी में! 😊",
        "तुम जिस भाषा में पूछोगे, मैं उसी में जवाब दूँगा! 🤗"
      ],
      name_inquiry: [
        "तुम्हारा नाम क्या है, मेरे दोस्त? 😊",
        "कृपया अपना नाम बताओ! मुझे जानना है! 🤗",
        "नाम क्या है आपका? चलो दोस्त बनते हैं! 🌟",
        "मैं तुम्हारा नाम जानना चाहता हूँ! बताओगे? 🎈"
      ],
      name_response: [
        "बहुत सुंदर नाम है! तुम्हें जानकर खुशी हुई! 🌈",
        "वाह! क्या प्यारा नाम है! 😍",
        "बहुत अच्छा नाम! चलो अब कुछ सीखते हैं! 📚",
        "सुंदर नाम! मुझे यह बहुत पसंद आया! 💖"
      ],
      default: [
        "बहुत अच्छा सवाल! चलो इसके बारे में सीखते हैं! 🤔",
        "दिलचस्प सवाल! मुझे पता करने दो... 💭",
        "वाह! तुम तो बहुत होशियार हो! चलो यह सीखें! 🎓",
        "मस्त सवाल! मैं तुम्हें इसका जवाब देता हूँ! ✨",
        "तुम बहुत अच्छे से पूछते हो! चलो एक्सप्लोर करें! 🚀",
        "अच्छा सवाल है! इसके बारे में बात करते हैं! 💬"
      ]
    },
    marathi: {
      greetings: [
        "नमस्कार! कसे आहात? 🌟",
        "हाय! काय शिकायचं आहे आज? 📚",
        "नमस्कार! मी तुमचा ट्यूटर आहे. कशी मदत करू शकतो? 🤗",
        "हॅलो! चला काहीतरी नवीन शिकूया! 🎉",
        "तुम्ही कसे आहात? मी तुमची कशी मदत करू शकतो? 😊"
      ],
      identity: [
        "मी LinguaKids ट्यूटर आहे, तुमचा AI मित्र! 🤖",
        "मला LinguaBot म्हणा - तुमचा खास ट्यूटर! 📖",
        "मी तुमचा AI ट्यूटर आहे, शिकायला मदत करायला नेहमी तयार! ✨",
        "मी इथे आहे तुम्हाला इंग्रजी, मराठी आणि इतर भाषा शिकवायला! 🌍"
      ],
      thanks: [
        "धन्यवाद! तुमचा दिवस चांगला जावो! 🌈",
        "आभारी आहे! मदत करून आनंद झाला! 😊",
        "खूप खूप धन्यवाद! आणखी काही प्रश्न? 💫",
        "आनंद झाला तुमची मदत करून! 🙏"
      ],
      farewell: [
        "पुन्हा भेटू! येतो मग! 👋",
        "लवकर परत या! शिकत राहा! 📚",
        "बाय बाय! पुढच्या वेळेपर्यंत! ⭐",
        "आनंदी राहा! पुन्हा भेटू! 🌈"
      ],
      colors: [
        "रंगांच्या दुनियेत आपले स्वागत आहे! लाल, पिवळा, हिरवा - हे सगळे रंग आहेत. तुमचा आवडता रंग कोणता? 🎨",
        "तुम्हाला कोणता रंग आवडतो? मला हिरवा खूप आवडतो - झाडांसारखा! 🌿",
        "रंग शिकणं मजेशीर आहे! निळं आकाश, पिवळं सूर्य, लाल सफरचंद! 🍎",
        "तुम्हाला माहितेय का? निळ्या आणि पिवळ्या रंगाच्या मिश्रणाने हिरवा रंग तयार होतो! 🎨"
      ],
      numbers: [
        "चला मोजूया! एक, दोन, तीन, चार, पाच! 🔢",
        "तुम्ही किती मोजू शकता? मी तर १०० पर्यंत मोजू शकतो! 💯",
        "मोजणीचा खेळ: मी म्हणेन एक, तुम्ही म्हणा १! चला सुरु करूया! 🎮",
        "इंग्रजीत मोजणी: one, two, three, four, five! 🇬🇧"
      ],
      animals: [
        "प्राण्यांचं जग खूप मजेशीर आहे! कुत्रा 'भौं-भौं' करतो, मांजर 'म्याऊं'! 🐶🐱",
        "तुम्हाला कोणता प्राणी आवडतो? हत्ती खूप मोठा आणि सिंह खूप ताकदवान! 🦁",
        "प्राण्यांची नावं इंग्रजीत शिकू इच्छिता? Dog, Cat, Elephant! 🐘",
        "तुम्हाला माहितेय का? चित्ते हे जगातले सर्वात वेगवान प्राणी आहेत! 🐆"
      ],
      languages: [
        "मी अनेक भाषा शिकवू शकतो - मराठी, हिंदी, जर्मन, चायनीज आणि इंग्रजी! 🌍",
        "तुम्हाला कोणती भाषा शिकायची आहे? मी मदत करू शकतो! 📚",
        "मराठीत विचारा तर मराठीत उत्तर, इंग्रजीत विचारा तर इंग्रजीत! 😊",
        "तुम्ही ज्या भाषेत विचाराल, मी त्याच भाषेत उत्तर देईन! 🤗"
      ],
      name_inquiry: [
        "तुमचं नाव काय आहे, माझ्या मित्रा? 😊",
        "कृपया तुमचं नाव सांगा! मला जाणून घ्यायचं आहे! 🤗",
        "नाव काय आहे तुमचं? चला मित्र होऊया! 🌟",
        "मला तुमचं नाव जाणून घ्यायचं आहे! सांगाल का? 🎈"
      ],
      name_response: [
        "खूप सुंदर नाव आहे! तुम्हाला भेटून आनंद झाला! 🌈",
        "व्वा! किती गोड नाव आहे! 😍",
        "खूप छान नाव! चला आता काहीतरी शिकूया! 📚",
        "सुंदर नाव! मला ते खूप आवडलं! 💖"
      ],
      default: [
        "खूप छान प्रश्न! चला याबद्दल शिकूया! 🤔",
        "मनोरंजक प्रश्न! मला शोधू द्या... 💭",
        "व्वा! तुम्ही खूप हुशार आहात! चला हे शिकूया! 🎓",
        "मस्त प्रश्न! मी तुम्हाला उत्तर देतो! ✨",
        "तुम्ही खूप छान विचारता! चला एक्सप्लोर करूया! 🚀",
        "छान प्रश्न आहे! याबद्दल बोलूया! 💬"
      ]
    },
    german: {
      greetings: [
        "Hallo! Wie geht es dir? 🌟",
        "Hi! Was möchtest du heute lernen? 📚",
        "Guten Tag! Ich bin dein Tutor. Wie kann ich helfen? 🤗",
        "Hallo! Lass uns etwas Neues lernen! 🎉",
        "Wie geht's? Was kann ich für dich tun? 😊"
      ],
      identity: [
        "Ich bin LinguaKids Tutor, dein AI-Freund! 🤖",
        "Nenn mich LinguaBot - dein persönlicher Tutor! 📖",
        "Ich bin dein AI-Tutor, immer bereit zu helfen! ✨",
        "Ich bin hier, um dir Englisch, Deutsch und andere Sprachen beizubringen! 🌍"
      ],
      thanks: [
        "Danke! Einen schönen Tag noch! 🌈",
        "Vielen Dank! Gerne geschehen! 😊",
        "Dankeschön! Noch weitere Fragen? 💫",
        "Freut mich, dass ich helfen konnte! 🙏"
      ],
      farewell: [
        "Auf Wiedersehen! Bis bald! 👋",
        "Komm bald wieder! Weiter lernen! 📚",
        "Tschüss! Bis zum nächsten Mal! ⭐",
        "Bleib glücklich! Bis bald! 🌈"
      ],
      colors: [
        "Willkommen in der Welt der Farben! Rot, Gelb, Grün - das sind Farben. Was ist deine Lieblingsfarbe? 🎨",
        "Welche Farbe magst du? Ich mag Grün - wie Bäume und Gras! 🌿",
        "Farben lernen macht Spaß! Blauer Himmel, gelbe Sonne, roter Apfel! 🍎",
        "Wusstest du? Blau und Gelb gemischt ergeben Grün! 🎨"
      ],
      numbers: [
        "Lass uns zählen! Eins, zwei, drei, vier, fünf! 🔢",
        "Wie weit kannst du zählen? Ich kann bis 100 zählen! 💯",
        "Zählspiel: Ich sage eins, du sagst 1! Lass uns anfangen! 🎮",
        "Auf Englisch zählen: one, two, three, four, five! 🇬🇧"
      ],
      animals: [
        "Die Tierwelt ist faszinierend! Der Hund bellt 'wau-wau', die Katze miaut! 🐶🐱",
        "Welches Tier magst du? Der Elefant ist groß, der Löwe ist stark! 🦁",
        "Möchtest du Tiernamen auf Englisch lernen? Dog, Cat, Elephant! 🐘",
        "Wusstest du? Geparde sind die schnellsten Tiere der Welt! 🐆"
      ],
      languages: [
        "Ich kann viele Sprachen unterrichten - Deutsch, Hindi, Marathi, Chinesisch und Englisch! 🌍",
        "Welche Sprache möchtest du lernen? Ich kann helfen! 📚",
        "Frag auf Deutsch, ich antworte auf Deutsch. Frag auf Englisch, ich antworte auf Englisch! 😊",
        "Ich antworte in der Sprache, in der du fragst! 🤗"
      ],
      name_inquiry: [
        "Wie heißt du, mein Freund? 😊",
        "Bitte sag mir deinen Namen! Ich möchte dich kennenlernen! 🤗",
        "Wie ist dein Name? Lass uns Freunde werden! 🌟",
        "Ich möchte deinen Namen wissen! Verrätst du mir? 🎈"
      ],
      name_response: [
        "Das ist ein wunderschöner Name! Schön dich kennenzulernen! 🌈",
        "Wow! Was für ein süßer Name! 😍",
        "Toller Name! Lass uns jetzt etwas lernen! 📚",
        "Wunderschöner Name! Ich mag ihn sehr! 💖"
      ],
      default: [
        "Gute Frage! Lass uns darüber lernen! 🤔",
        "Interessante Frage! Lass mich nachdenken... 💭",
        "Wow! Du bist sehr schlau! Lass uns das lernen! 🎓",
        "Tolle Frage! Ich werde dir antworten! ✨",
        "Du fragst so gut! Lass uns erkunden! 🚀",
        "Gute Frage! Lass uns darüber sprechen! 💬"
      ]
    },
    chinese: {
      greetings: [
        "你好！你好吗？🌟",
        "嗨！今天想学什么？📚",
        "你好！我是你的导师。需要帮助吗？🤗",
        "哈喽！我们一起学点新东西吧！🎉",
        "你好吗？我能帮你什么？😊"
      ],
      identity: [
        "我是LinguaKids导师，你的AI朋友！🤖",
        "叫我LinguaBot - 你的专属导师！📖",
        "我是你的AI导师，随时准备帮助你学习！✌️",
        "我在这里教你英语、中文和其他语言！🌍"
      ],
      thanks: [
        "谢谢！祝你有美好的一天！🌈",
        "非常感谢！很高兴能帮到你！😊",
        "多谢！还有其他问题吗？💫",
        "很高兴能帮到你！🙏"
      ],
      farewell: [
        "再见！下次见！👋",
        "快点回来！继续学习！📚",
        "拜拜！下次再见！⭐",
        "保持快乐！下次见！🌈"
      ],
      colors: [
        "欢迎来到色彩世界！红、黄、绿 - 这些都是颜色。你最喜欢的颜色是什么？🎨",
        "你喜欢什么颜色？我喜欢绿色 - 像树和草！🌿",
        "学习颜色很有趣！蓝色的天空，黄色的太阳，红色的苹果！🍎",
        "你知道吗？蓝色和黄色混合变成绿色！🎨"
      ],
      numbers: [
        "我们来数数！一、二、三、四、五！🔢",
        "你能数到多少？我能数到100！💯",
        "数数游戏：我说一，你说1！我们开始吧！🎮",
        "用英语数数：one, two, three, four, five！🇬🇧"
      ],
      animals: [
        "动物世界真奇妙！狗叫'汪汪'，猫叫'喵喵'！🐶🐱",
        "你喜欢什么动物？大象很大，狮子很强大！🦁",
        "想学动物英文名吗？Dog, Cat, Elephant！🐘",
        "你知道吗？猎豹是世界上跑得最快的动物！🐆"
      ],
      languages: [
        "我可以教很多语言 - 中文、印地语、马拉提语、德语和英语！🌍",
        "你想学什么语言？我可以帮忙！📚",
        "用中文问就用中文答，用英文问就用英文答！😊",
        "你用哪种语言问，我就用哪种语言回答！🤗"
      ],
      name_inquiry: [
        "你叫什么名字，我的朋友？😊",
        "请告诉我你的名字！我想认识你！🤗",
        "你叫什么？我们做朋友吧！🌟",
        "我想知道你的名字！能告诉我吗？🎈"
      ],
      name_response: [
        "真是个美丽的名字！很高兴认识你！🌈",
        "哇！多么可爱的名字！😍",
        "好名字！现在我们学点什么吧！📚",
        "美丽的名字！我非常喜欢！💖"
      ],
      default: [
        "好问题！我们来学习一下！🤔",
        "有趣的问题！让我想想... 💭",
        "哇！你真聪明！我们来学习这个！🎓",
        "问得好！我来回答你！✨",
        "你问得真好！我们一起探索吧！🚀",
        "好问题！我们聊聊这个！💬"
      ]
    }
  };

  // Conversation memory
  let conversationMemory = {
    lastTopic: null,
    questionCount: 0,
    userName: null,
    topicsDiscussed: [],
    lastDetectedLang: language
  };

  // Enhanced language detection with Romanized support
  function detectLanguage(text) {
    const lowerText = text.toLowerCase().trim();
    
    // Check for German specific words
    const germanWords = ['hallo', 'guten', 'tag', 'wie', 'geht', 'danke', 'bitte', 'tschüss', 'auf', 'wiedersehen', 'ich', 'du', 'sie', 'wir', 'und', 'oder', 'aber', 'nicht', 'ja', 'nein'];
    if (germanWords.some(word => lowerText.includes(word))) {
      return 'german';
    }
    
    // Check for Chinese characters
    if (/[\u4e00-\u9fff]/.test(text)) {
      return 'chinese';
    }
    
    // Check for Devanagari script (Hindi/Marathi)
    if (/[अ-ह]/.test(text)) {
      // Further distinguish between Hindi and Marathi (simplified)
      const marathiSpecific = ['आहे', 'नाही', 'कसे', 'कशी', 'माझे', 'तुझे', 'आम्ही', 'तुम्ही'];
      if (marathiSpecific.some(word => text.includes(word))) {
        return 'marathi';
      }
      return 'hindi';
    }
    
    // Check for Romanized Hindi words
    const romanizedHindiWords = ['namaste', 'kaise', 'kya', 'hai', 'mera', 'tera', 'apka', 'tum', 'main', 'hum', 'aur', 'nahi', 'haan', 'theek', 'acha', 'accha', 'shukriya', 'dhanyavaad', 'alvida', 'phir', 'kal', 'aaj', 'kab', 'kahan', 'kyon', 'kitna', 'kitne'];
    const hindiMatchCount = romanizedHindiWords.filter(word => lowerText.includes(word)).length;
    
    // Check for Romanized Marathi words
    const romanizedMarathiWords = ['namaskar', 'kase', 'kay', 'ahe', 'maza', 'tujha', 'apan', 'tumhi', 'mi', 'amhi', 'aani', 'nahi', 'ho', 'chaan', 'masta', 'dhanyavad', 'pudhe', 'bhetu', 'aata', 'udya', 'kal', 'kevh', 'kuth', 'kon', 'kit'];
    const marathiMatchCount = romanizedMarathiWords.filter(word => lowerText.includes(word)).length;
    
    if (hindiMatchCount > marathiMatchCount && hindiMatchCount > 0) {
      return 'hindi';
    }
    if (marathiMatchCount > hindiMatchCount && marathiMatchCount > 0) {
      return 'marathi';
    }
    
    // Check for English (default)
    const englishWords = ['hello', 'hi', 'how', 'are', 'you', 'what', 'is', 'your', 'name', 'i', 'am', 'thanks', 'thank', 'bye', 'goodbye', 'please', 'help', 'learn', 'teach'];
    if (englishWords.some(word => lowerText.includes(word))) {
      return 'english';
    }
    
    // Default to interface language
    return language;
  }

  // Get appropriate response in the detected language
  function getResponseInLanguage(detectedLang, category, subcategory = null) {
    // Update memory
    conversationMemory.lastDetectedLang = detectedLang;
    
    // For detected language, use that language's responses
    const lang = responses[detectedLang] ? detectedLang : language;
    const responseSet = responses[lang] || responses.english;
    
    if (subcategory === 'name_with_name') {
      return responseSet.name_response[Math.floor(Math.random() * responseSet.name_response.length)];
    }
    
    return responseSet[category] ? 
      responseSet[category][Math.floor(Math.random() * responseSet[category].length)] : 
      responseSet.default[Math.floor(Math.random() * responseSet.default.length)];
  }

  // Check if message is asking about a specific language
  function getLanguageFromQuestion(message) {
    const lowerMsg = message.toLowerCase();
    const languageKeywords = {
      'hindi': ['hindi', 'हिंदी', 'hindī'],
      'marathi': ['marathi', 'मराठी', 'marāṭhī'],
      'german': ['german', 'deutsch'],
      'chinese': ['chinese', '中文', '汉语', 'mandarin'],
      'english': ['english', 'अंग्रेजी', 'ingrajī', 'इंग्रजी']
    };
    
    for (const [lang, keywords] of Object.entries(languageKeywords)) {
      if (keywords.some(keyword => lowerMsg.includes(keyword))) {
        return lang;
      }
    }
    return null;
  }

  // Generate response in the same language as input
  function generateResponse(userMessage) {
    const message = userMessage.trim();
    const detectedLang = detectLanguage(message);
    
    conversationMemory.questionCount++;

    // Check if user is asking about learning a specific language
    const askedLang = getLanguageFromQuestion(message);
    if (askedLang && askedLang !== detectedLang) {
      const langResponses = {
        'english': `Yes! I can teach you ${askedLang}! Let's get started! 🌟`,
        'hindi': `हाँ! मैं तुम्हें ${askedLang === 'hindi' ? 'हिंदी' : askedLang === 'marathi' ? 'मराठी' : askedLang === 'german' ? 'जर्मन' : askedLang === 'chinese' ? 'चीनी' : askedLang} सिखा सकता हूँ! चलो शुरू करते हैं! 🌟`,
        'marathi': `होय! मी तुम्हाला ${askedLang === 'marathi' ? 'मराठी' : askedLang === 'hindi' ? 'हिंदी' : askedLang === 'german' ? 'जर्मन' : askedLang === 'chinese' ? 'चायनीज' : askedLang} शिकवू शकतो! चला सुरु करूया! 🌟`,
        'german': `Ja! Ich kann dir ${askedLang === 'german' ? 'Deutsch' : askedLang} beibringen! Lass uns anfangen! 🌟`,
        'chinese': `是的！我可以教你${askedLang === 'chinese' ? '中文' : askedLang}！我们开始吧！🌟`
      };
      return langResponses[detectedLang] || langResponses.english;
    }

    // Extract user name (works across languages)
    const namePatterns = [
      /(?:my name is |i am |call me )(\w+)/i,
      /(?:मेरा नाम |मैं )(\w+)/i,
      /(?:माझे नाव |मी )(\w+)/i,
      /(?:mein Name ist |ich heiße |ich bin )(\w+)/i,
      /(?:我的名字是 |我叫 )(\w+)/i
    ];

    for (const pattern of namePatterns) {
      const match = message.match(pattern);
      if (match && !conversationMemory.userName) {
        conversationMemory.userName = match[1];
        return getResponseInLanguage(detectedLang, 'name_response', 'name_with_name');
      }
    }

    // Check for name inquiry in any language
    const nameInquiryPatterns = [
      /what (?:is|'s) (?:my|your) name|do you know my name/i,
      /(?:मेरा|तुम्हारा|आपका) नाम क्या है/i,
      /(?:माझे|तुझे|तुमचे) नाव काय आहे/i,
      /wie heiße ich|wie ist mein name/i,
      /我叫什么|你叫什么/i
    ];

    if (nameInquiryPatterns.some(pattern => pattern.test(message))) {
      if (conversationMemory.userName) {
        const nameResponses = {
          'english': `Your name is ${conversationMemory.userName}! 😊`,
          'hindi': `आपका नाम ${conversationMemory.userName} है! 😊`,
          'marathi': `तुमचे नाव ${conversationMemory.userName} आहे! 😊`,
          'german': `Dein Name ist ${conversationMemory.userName}! 😊`,
          'chinese': `你的名字是${conversationMemory.userName}！😊`
        };
        return nameResponses[detectedLang] || nameResponses.english;
      } else {
        return getResponseInLanguage(detectedLang, 'name_inquiry');
      }
    }

    // Categorize user input
    const categories = {
      greetings: ['hi', 'hello', 'hey', 'नमस्ते', 'हाय', 'नमस्कार', 'hallo', 'guten tag', '你好'],
      thanks: ['thank', 'thanks', 'धन्यवाद', 'शुक्रिया', 'danke', '谢谢', 'आभार'],
      farewell: ['bye', 'goodbye', 'अलविदा', 'पुन्हा भेटू', 'tschüss', 'auf wiedersehen', '再见', 'बाय'],
      colors: ['color', 'colour', 'रंग', 'farben', '颜色', 'रंग'],
      numbers: ['number', 'count', 'संख्या', 'गिनती', 'zahlen', '数字', 'मोजणी'],
      animals: ['animal', 'pet', 'जानवर', 'प्राणी', 'tier', '动物', 'पशु'],
      languages: ['language', 'भाषा', 'sprache', '语言', 'बोली']
    };

    for (const [category, patterns] of Object.entries(categories)) {
      if (patterns.some(pattern => message.toLowerCase().includes(pattern))) {
        conversationMemory.lastTopic = category;
        conversationMemory.topicsDiscussed.push(category);
        return getResponseInLanguage(detectedLang, category);
      }
    }

    // Default response
    return getResponseInLanguage(detectedLang, 'default');
  }

  function addMessage(text, sender) {
    const msg = document.createElement("div");
    msg.className = `linguakids-message linguakids-${sender}-message`;
    msg.textContent = text;
    messages.appendChild(msg);
    messages.scrollTop = messages.scrollHeight;
  }

  function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, "user");
    input.value = "";

    // Show typing indicator
    const typingIndicator = document.createElement("div");
    typingIndicator.className = "linguakids-typing-indicator";
    typingIndicator.id = "typingIndicator";
    typingIndicator.innerHTML = '<span></span><span></span><span></span>';
    messages.appendChild(typingIndicator);
    messages.scrollTop = messages.scrollHeight;

    // Simulate thinking
    const thinkTime = Math.min(500 + (text.length * 10), 1500);

    setTimeout(() => {
      const indicator = document.getElementById("typingIndicator");
      if (indicator) indicator.remove();
      
      const response = generateResponse(text);
      addMessage(response, "bot");

      // Engagement question after 3 messages
      if (conversationMemory.questionCount === 3) {
        setTimeout(() => {
          const engageResponses = {
            'english': 'What else would you like to learn? 😊',
            'hindi': 'और क्या सीखना चाहोगे? 😊',
            'marathi': 'आणखी काय शिकू इच्छिता? 😊',
            'german': 'Was möchtest du noch lernen? 😊',
            'chinese': '还想学什么？😊'
          };
          const currentLang = conversationMemory.lastDetectedLang;
          addMessage(engageResponses[currentLang] || engageResponses.english, "bot");
        }, 1000);
      }
    }, thinkTime);
  }

  sendBtn.onclick = sendMessage;

  input.addEventListener("keypress", function (e) {
    if (e.key === "Enter") sendMessage();
  });

  // Welcome message in appropriate language - FIXED to match interface language
  const welcomeMsgs = {
    'english': 'Hi! I am your LinguaKids Tutor. You can ask in any language - I will respond in the same language! What would you like to learn? 🌟',
    'hindi': 'नमस्ते! मैं आपका LinguaKids ट्यूटर हूँ। आप हिंदी, अंग्रेजी या रोमन हिंदी में पूछ सकते हैं! मैं उसी भाषा में जवाब दूंगा। क्या सीखना चाहेंगे? 🌟',
    'marathi': 'नमस्कार! मी तुमचा LinguaKids ट्यूटर आहे. तुम्ही मराठी, इंग्रजी किंवा रोमन मराठीत विचारू शकता! मी त्याच भाषेत उत्तर देईन. काय शिकू इच्छिता? 🌟',
    'german': 'Hallo! Ich bin dein LinguaKids Tutor. Du kannst auf Deutsch, Englisch oder anderen Sprachen fragen! Ich antworte in derselben Sprache. Was möchtest du lernen? 🌟',
    'chinese': '你好！我是你的LinguaKids导师。你可以用中文、英文或其他语言提问！我会用同样的语言回答。你想学什么？ 🌟'
  };

  // Make sure we have a valid language key - this ensures the welcome message matches the interface language
  const welcomeLang = (language && welcomeMsgs[language]) ? language : 'english';
  addMessage(welcomeMsgs[welcomeLang], "bot");
}