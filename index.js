'use strict';
var TelegramBot = require('node-telegram-bot-api');

var TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || '';
var bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

var GW2Api = require('./lib/gw2-api');
var api = new GW2Api();

function getDailyFractals(callback) {
  var match = "Daily Tier 4"
  api.getAchievementsByCategory(88, (err, res) => {
      var promises = res.achievements.map((achiev) => {
          return new Promise((resolve, reject) => {
              api.getAchievementDetails(achiev, (err, detail) => {
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

bot.onText(/\!fractals/, function(msg) {
  var chatId = msg.chat.id;
  getDailyFractals((err, results) => {
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
})
