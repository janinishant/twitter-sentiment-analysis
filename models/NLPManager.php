<?php
require_once 'phpInsight/autoload.php';
class NLPManager {
    /**
     * Classify a collection of tweets as positive, negative or neutral
     * @param array $tweetCollection Collection of tweet data
     * @return string response json
     */
    public function classifyTweets ($tweetCollection) {

        $sentiment = new \PHPInsight\Sentiment();
        $response = array(
            'pos' => array(),
            'neg' => array(),
            'neu' => array()
        );

        foreach ($tweetCollection['statuses'] as $index => $tweetData) {
            $tweetText = $tweetData['text'];
            $scores = $sentiment->score($tweetText);
            $class = $sentiment->categorise($tweetText);

            $response[$class][] = array(
                'string' => $tweetText,
                'scores' => $scores,
                'profile_image_url' => $tweetData['user']['profile_image_url'],
                'user_name' => $tweetData['user']['name']
            );

        }
        return $response;
    }
}
