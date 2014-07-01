$(function() {

    var REFRESH_RATE = 3 * 60 * 1000 // 3 minutes
      , $builds = $('#build-container')
      ;

    function loadTemplate(src, id, callback) {
        $.ajax({
            url: src,
            success: function(resp) {
                var $script = $('<script type="text/template" id="' + id + '_tmpl">' + resp + '</script>');
                $('body').append($script);
                callback(null, id + '_tmpl');
            },
            failure: callback
        });
    }

    function buildTravisUrl(repoSlug, buildId) {
        return 'https://travis-ci.org/' + repoSlug + '/builds/' + buildId;
    }

    function buildPullRequestUrl(repoSlug, prId) {
        return 'https://github.com/' + repoSlug + '/pull/' + prId;
    }

    function renderBuilds(templateId, builds) {
        var doomed = [];
        _.each(builds, function(repoBuilds, repoName) {
            if (! repoBuilds.length) {
                doomed.push(repoName);
            }
            _.each(repoBuilds, function(build) {
                console.log(build);
                if (build.started_at) {
                    build.started_ago = ' ' + moment(build.started_at).from(new Date());
                } else {
                    build.started_ago = '';
                }
                build.html_url = buildTravisUrl('numenta/' + repoName, build.id);
                if (build.pull_request) {
                    build.pr_url = buildPullRequestUrl('numenta/' + repoName, build.pull_request_number);
                }
            });
        });
        _.each(doomed, function(repoToRemove) {
            delete builds[repoToRemove];
        });
        template = Handlebars.compile($('#' + templateId).html())
        $builds.html(template({builds: builds}));
    }

    function loadPage(templId, callback) {
        $builds.html("<h2>Loading...</h2>");
        $.getJSON('/_builds/', function(builds) {
            renderBuilds(templId, builds);
            if (callback) {
                callback();
            }
        });
    }

    loadTemplate('/js/builds/builds.html', 'builds', function(err, templId) {
        if (err) {
            return console.log(err);
        }
        loadPage(templId, function() {
            setInterval(function() {
                loadPage(templId);
            }, REFRESH_RATE);
        });
    });
});