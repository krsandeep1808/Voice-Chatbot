const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

async function testOpenAI() {
    try {
        console.log('Testing OpenAI connection...');
        
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant. Respond in a friendly way."
                },
                {
                    role: "user",
                    content: "Hello, can you hear me?"
                }
            ],
            max_tokens: 50
        });

        console.log('✅ OpenAI is working!');
        console.log('Response:', completion.choices[0].message.content);
        console.log('🎉 Your bot now has full AI capabilities!');
        
    } catch (error) {
        console.error('❌ OpenAI Error:', error.message);
        if (error.code === 'invalid_api_key') {
            console.log('🔑 Please check your OPENAI_API_KEY in the .env file');
        }
    }
}

testOpenAI();
