<?php
require_once 'NLPManager.php';
class TweetManager {
    private function getTweetsByQuery($query) {
        require_once('TwitterAPIExchange/TwitterAPIExchange.php');
        require_once('../conf/config.php');
        $url = 'https://api.twitter.com/1.1/search/tweets.json';
        $getfield = '?q='.$query;
        $requestMethod = 'GET';

        $twitter = new TwitterAPIExchange($twitter_api_conf);
        return $twitter->setGetfield($getfield)
            ->buildOauth($url, $requestMethod)
            ->performRequest();
    }

    private function structureDataForPieVisualization ($tweets) {
        $pieData = array();
        foreach($tweets as $categoryName => $tweetData) {
            $pieData[] = array($categoryName, count($tweetData));
        }
        return $pieData;
    }

    private function structureDataForAnimatedBarVisualization ($tweets) {
        $response = array();
        $categoryName = array();
        $response['yaxis'] = array(
            'pos' => array(),
            'neu' => array(),
            'neg' => array(),
        );
        foreach($tweets as $catName => $tweetData) {
            foreach ($tweetData as $index => $tweet) {
                $categoryName[] = $tweet['string'];
                foreach( $tweet['scores'] as $key => $scoreProbability ) {
                    $response['yaxis'][$key][] = $scoreProbability;
                }
            }

        }
        $response['categoryNames'] = $categoryName;
        return $response;
    }

    public function getResultsSortedBySentiments() {
        $query = $_GET['q'];
        $query = urlencode(urldecode($query));
        $response = array();
        if (!empty($query)) {
            $tweets = $this->getTweetsByQuery($query);
            $tweets = json_decode($tweets, true);
            $nlpManager = new NLPManager();
            $categorizedTweets = $nlpManager->classifyTweets($tweets);
            $response['results'] = $categorizedTweets;
            $response['meta'] = $tweets['search_metadata'];
            $response['meta']['totalCount'] = count($tweets['statuses']);
            $response['visualization']['pie'] = $this->structureDataForPieVisualization($categorizedTweets);
            $response['visualization']['bar'] = $this->structureDataForAnimatedBarVisualization($categorizedTweets);
            echo json_encode($response);
        }
    }
}

//Basic checking whether this function is invokable
$invokables = array('getResultsSortedBySentiments' => true);

//Very basic router
$url = $_SERVER['REQUEST_URI'];
$urlParts = explode('/', $url);
$lastPair = array_pop($urlParts);
$parts = (explode('?',$lastPair));
$functionName = $parts[0];
if (isset($invokables[$functionName])) {
    $tm = new TweetManager();
    $tm->$functionName();
}