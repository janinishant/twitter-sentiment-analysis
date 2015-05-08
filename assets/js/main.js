/**
 * Contructor for my JS app
 */
var tintupTweetApp = function () {
    this.baseUrl = "https://guarded-wave-7955.herokuapp.com/";
    this.modelsBaseUrl = "https://guarded-wave-7955.herokuapp.com/models/";
    this.sentimentColorMap = {
        'pos': 'green',
        'neg': 'red',
        'neu': ''
    };
    this.data = {};

};
/**
 * Make an AJAX call and get sentiments sorted results
 * @param query query term
 */
tintupTweetApp.prototype.getSentimentsSortedResults = function (query) {
    var self = this;
    $.ajax({
        method: 'GET',
        url: this.modelsBaseUrl + 'TweetManager.php/getResultsSortedBySentiments',
        data: {"q": query},
        success: function (data, response) {
            data = JSON.parse(data);
            self.data = data;
            debugger;
            if (!data.meta || (data.meta &&  parseInt(data.meta.totalCount) == 0)) {
                self.renderNoResults();
                return;
            }
            //render results
            self.renderCategorizedResults(data['results']);
            //render meta data
            self.renderCategorizedResultsMeta(data['meta']);
        },
        error: function () {
            //need to show no results found page
            self.renderNoResults();
        }
    })
};

tintupTweetApp.prototype.renderNoResults = function () {
    $('#search-result').html('<img src="'+this.baseUrl+'assets/img/no_results.png">');
    $("#visualize-button").attr('disabled','disabled');
};


tintupTweetApp.prototype.renderCategorizedResults = function(results) {
    $("#visualize-button").removeAttr('disabled');
    //building complete html
    var html = "";
    //closures in js
    var self = this;
    //render results
    for (var sentiment in results) {
        results[sentiment].forEach(function(result) {
            html += self.buildResult(result, sentiment);
        });
    }
    //Since DOM access is expensive, put all things at once
    $('#search-result').html(html);
};

/**
 * Draw pie chart to visualize sentiments analysis
 * @param pieVisualizationData structured data for highcharts
 */
tintupTweetApp.prototype.drawPie = function (pieVisualizationData) {
    $('#pie').highcharts({
        chart: {
            plotBackgroundColor: null,
            plotBorderWidth: null,
            plotShadow: false
        },
        title: {
            text: 'Distribution of Sentiments in tweets. Shows % of positive (pos), negative(neg) and neutral(neu) tweets'
        },
        tooltip: {
            pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                dataLabels: {
                    enabled: false
                },
                showInLegend: true
            }
        },
        series: [{
            type: 'pie',
            name: 'Browser share',
            data: pieVisualizationData
        }]
    });
};

/**
 * Draw bar chart to show detailed probabilities of sentiments for each tweet
 * @param barVisualizationData structured bar chart data from back end
 */
tintupTweetApp.prototype.drawBar = function (barVisualizationData) {
    var nameDataPairs = barVisualizationData.yaxis;
    var nameDataArray = [];
    for (var key in nameDataPairs) {
        nameDataArray.push({
            'name': key,
            'data': nameDataPairs[key]
        });
    }
    $("#bar").highcharts({
        chart: {
            type: 'column'
        },
        title: {
            text: 'Probabilities of Sentiments for all tweets'
        },
        xAxis: {
            categories: barVisualizationData.categoryNames,
            crosshair: true
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Probabilities (%)'
            }
        },
        tooltip: {
            headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
            pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                '<td style="padding:0"><b>{point.y:.1f} mm</b></td></tr>',
            footerFormat: '</table>',
            shared: true,
            useHTML: true
        },
        plotOptions: {
            column: {
                pointPadding: 0.2,
                borderWidth: 0
            }
        },
        series: nameDataArray
    });

};

/**
 * Render the meta data, query term and nos of seconds to fetch results
 * @param results
 */
tintupTweetApp.prototype.renderCategorizedResultsMeta = function(results) {
    var html = "<div class='row' >" +
        "<div class='col-lg-3' ><strong>Your Searched for</strong>: "+results['query']+" </div> " +
        "<div class='col-lg-3'><strong>Time to Search</strong>: "+ results['completed_in'] +"s</div> " +
        "</div> <hr>";
    //Since DOM access is expensive, put all things at once
    $('#search-meta').html(html);
};

/**
 * Build each row of the results
 * @param result results array
 * @param polarity sentiment polariy
 * @returns {string} template to be appended to DOM
 */
tintupTweetApp.prototype.buildResult = function(result, polarity) {
    var background_color = this.sentimentColorMap[polarity];
    return "<div class='media'> \
    <div class='media-left'> \
        <img class='media-object img-circle' src='"+result['profile_image_url']+"' style='width: 64px; height: 64px;'> \
     </div> \
        <div class='media-body'> \
        <h4 class='media-heading' id='media-heading'><img src='"+this.baseUrl+"assets/img/twitter-default.png' style='width: 24px; height: 24px; background-color: "+background_color+";'> "+result['string']+"</h4> \
    . \
    </div> \
    </div>";
};

var appInstance;
//My event handlers
$(document).ready(function() {
    //when search button is clicked
    $('#search-button').click(function(event) {
        if (appInstance && appInstance.data) {
            $('#search-visualization-container').hide();
            $('#search-result').show('slow');
        }
        //get the query term
        var queryTerm = $.trim($('#search-input-query').val());
        //return if query term is empty, do nothing
        if (!queryTerm) return;
        //create instance of the tweet app
        appInstance = new tintupTweetApp();
        //request for grouped and sorted tweets
        appInstance.getSentimentsSortedResults(queryTerm)
    });

    $('#visualize-button').click(function(event) {
         if (appInstance && appInstance.data) {
             $('#search-result').hide('slow');
             $('#search-visualization-container').show();

             appInstance.drawPie(appInstance.data['visualization']['pie']);
             appInstance.drawBar(appInstance.data['visualization']['bar']);
         }
    });
});


