require('dotenv-safe').config()
!(async () => {
  const fs = require('fs').promises
  const appKey = process.env.APP_KEY
  const appSecret = process.env.APP_SECRET
  const { TwitterApi } = require('twitter-api-v2')
  const readline = require('readline')

  const tempClient = new TwitterApi({
    appKey,
    appSecret,
  })

  const link = await tempClient.generateAuthLink()

  console.log('Open the URL: ' + link.url)
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const question = require('util').promisify(rl.question).bind(rl)
  const token = await question('Enter the token, and press enter: ')
  
  const userClient = new TwitterApi({
    appKey,
    appSecret,
    accessToken: link.oauth_token,
    accessSecret: link.oauth_token_secret,
  })

  const result = await userClient.login(token)
  const { client } = result
  const user = await client.currentUser()
  console.log('User: ', user)
  while (true) {
    const tweets = await client.v2.userTimeline(user.id_str)
    if (tweets.tweets.length === 0) break
    for (const tweet of tweets.tweets) {
      try {
        await client.v1.deleteTweet(tweet.id)
        console.log('Deleted tweet:')
        console.log(tweet)
        await fs.appendFile('tweets.txt', require('util').inspect(tweet, false, 10000, false) + '\n')
      } catch (e) {
        console.error('Could not delete tweet', e.stack || e)
      }
    }
  }
})()
