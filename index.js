const line = require('@line/bot-sdk')
const express = require('express')
const axios = require('axios').default
const dotenv = require('dotenv')
const mqtt = require('mqtt')

const env = dotenv.config().parsed
const app = express()

const lineConfig ={
    channelAccessToken: env.ACCESS_TOKEN,
    channelSecret: env.SECRET_TOKEN
}

// create client
const client = new line.Client(lineConfig)

const mqttConfig = {
    host: env.MQTT_HOST,
    port: env.MQTT_PORT,
    username: env.MQTT_USERNAME,
    password: env.MQTT_PASSWORD
}
const clientMqtt = mqtt.connect(mqttConfig.host, {
    username: mqttConfig.username,
    password: mqttConfig.password,
    port: mqttConfig.port
})

clientMqtt.on('connect', function () {
    console.log('MQTT connected')
    clientMqtt.subscribe('light', function (err) {
        if (!err) {
            console.log('MQTT subscribe success')
        }
    })
})

clientMqtt.on('message', function (topic, message) {
    console.log('MQTT message', message.toString())
})

app.post('/webhook', line.middleware(lineConfig), async (req, res) => {
    try {
        const events = req.body.events
        console.log('event=>>>>', events)
        if (events.length > 0) {
            for (let i = 0; i < events.length; i++) {
                const event = events[i]
                if (event.type === 'message' && event.message.type === 'text') {
                    if (event.message.text === 'ปิดไฟ') {
                        clientMqtt.publish('light', 'OFF')
                        await client.replyMessage(event.replyToken, {
                            type: 'text',
                            text: 'ปิดไฟเรียบร้อย'
                        })
                    }
                    else if (event.message.text === 'เปิดไฟ'){
                        clientMqtt.publish('light', 'ON')
                        await client.replyMessage(event.replyToken, {
                            type: 'text',
                            text: 'เปิดไฟเรียบร้อย'
                        })
                    }
                    else {
                        await client.replyMessage(event.replyToken,{
                            type: 'text',
                            text: 'กรุณาพิมพ์ "ปิดไฟ" หรือ "เปิดไฟ" เท่านั้น'
                        })
                    }
                }
            }
        }
        res.status(200).send('OK')
    } catch (error) {
        console.error(error)
        res.status(500).end()
    }
})

app.listen(4000, () => {
    console.log('listening on 4000')
})