var request = require('request');

var noOp = () => {}

class API {
    constructor(apiKey) {
        this.apiKey = apiKey
    }

    getAchievementsByCategory(category, callback) {
        callback = callback || noOp

        request(`https://api.guildwars2.com/v2/achievements/categories/${category}`, (err, resp, body) => {
            if (err) return callback(err)
            if (resp.statusCode != 200) return callback(body)
            var data = JSON.parse(body)
            if (data.error) return callback(data.error)
            callback(null, data)
        });
    }
    getAchievementDetails(achi, callback) {
        callback = callback || noOp

        request(`https://api.guildwars2.com/v2/achievements/${achi}`, (err, resp, body) => {
            if (err) return callback(err)
            if (resp.statusCode != 200) return callback(body)
            var data = JSON.parse(body)
            if (data.error) return callback(data.error)
            callback(null, data)
        });
    }
    getMotd(guild, callback) {
      callback = callback || noOp;

      request(`https://api.guildwars2.com/v2/guild/${guild}?access_token=${this.apiKey}`, (err, resp, body) => {
        if (err) return callback(err)
        if (resp.statusCode != 200) return callback(body)
        var data = JSON.parse(body)
        if (data.error) return callback(data.error)
        callback(null, data)
      })
    }
}

module.exports = API
