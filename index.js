'use strict';
var TelegramBot = require('node-telegram-bot-api');
var GW2Api = require('./lib/gw2-api');

var TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || '';

var API_KEY = process.env.API_KEY || '';
var GUILD_ID = process.env.GUILD_ID || '';

var api = new GW2Api(API_KEY);

var onError = (bot, chatId, message) => {
  bot.sendMessage(chatId, message, {
    "parse_mode": "Markdown",
    "disable_web_page_preview": true
  });
}

function getDailyFractals(callback) {
  var match = "Daily Tier 4"
  api.getAchievementsByCategory(88, (err, res) => {
      if(err) {
        return callback(err)
      }
    
      var promises = res.achievements.map((achiev) => {
          return new Promise((resolve, reject) => {
              api.getAchievementDetails(achiev, (err, detail) => {
                  if(err) {
                    return callback(err)
                  }
                
                  // Check the name is valid
                  if (detail.name.indexOf(match) === -1) {
                      // we don't want to reject here as it fails the entire chain
                      // reject(`${detail.name} has an invalid name`);
                      resolve(null)
                      return
                  }

                  resolve(detail)
              })
          })
      })

      Promise.all(promises)
      .then(res => {
          var results = res.filter(r => r)
          callback(null, results)
      })
      .catch(err => {
          callback(err)
      })
  })
}

var bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
bot.on('message', (msg) => console.log(`(${msg.chat.title} / ${msg.from.first_name}) ${msg.text}`));
bot.on('message', (msg) => {
  if(!msg ||!msg.chat || !msg.text) {
    return;
  }
  
  var chatId = msg.chat.id;
  if (msg.text.match(/\!motd/)) {
    api.getMotd(GUILD_ID, (err, res) => {
       if(err) {
        return onError(bot, chatId, "Error getting motd. Is the GW2 API Down?")
       }
      
      bot.sendMessage(chatId, res.motd, {
        "parse_mode": "Markdown",
        "disable_web_page_preview": true
      });
    })
  }
  
  if(msg.text.match(/\!fractals/)) {
    getDailyFractals((err, results) => {
      if(err) {
        return onError(bot, chatId, "Error getting daily fractals. Is the GW2 API Down?")
      }
      
      var output = "Today's daily fractals: \n```\n"

      results.forEach(res => {
          var name = res.name.substr("Daily Tier 4".length + 1)
          var points = res.bits.map((obj) => {
              return obj.text.substr(14)
          })

          output += `${name} [${points.join(", ")}]\n`
      })
      output += "```"
      bot.sendMessage(chatId, output, {
        "parse_mode": "Markdown",
      });
    })
  }
});
