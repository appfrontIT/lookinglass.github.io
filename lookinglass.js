// Lookinglass


var metro_colors = [
    'black', 'white', 'lime', 'green', 'emerald', 'teal', 'blue', 'cyan', 'cobalt', 'indigo', 'violet',
    'pink', 'magenta', 'crimson', 'red', 'orange', 'amber', 'yellow', 'brown', 'olive',
    'steel', 'mauve', 'taupe', 'gray', 'dark', 'darker', 'darkBrown', 'darkCrimson',
    'darkMagenta', 'darkIndigo', 'darkCyan', 'darkCobalt', 'darkTeal', 'darkEmerald',
    'darkGreen', 'darkOrange', 'darkRed', 'darkPink', 'darkViolet', 'darkBlue',
    'lightBlue', 'lightRed', 'lightGreen', 'lighterBlue', 'lightTeal', 'lightOlive',
    'lightOrange', 'lightPink', 'grayDark', 'grayDarker', 'grayLight', 'grayLighter'
];

var adBlock = false;



(function($){
    "use strict";

    $("h1 .nav-button").addClass('transform');
})(jQuery);


if (window.location.hostname !== 'localhost') {

    (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
        (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
        m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
    })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

    ga('create', 'UA-58849249-3', 'auto');
    ga('send', 'pageview');

}


function setLookinglassCss() {
    
    $('.app-bar').css('background','#ac2685');
    $('.bar-menu').css('background','#ac2685');
    $('.bg-darkTeal').css('background-color','#ac2685 !important');
    $('.bg-darkTeal').attr('style','background: #ac2685 !important');
    $('#lookinglassConsole').attr('style','width: 50%; height: auto; margin: auto; background: #ac2685; color: white; padding: 10px; border-style: solid double; border-color: white; border-width: thick; opacity: 0.60; position: fixed')
    
}

function createLookinglassConsole() {
    $('div').first().before('<div id="lookinglassConsole" class="lookinglassConsole">Lookinglass is here</div>')
    $('#lookinglassConsole').append('<div id="lgCPathName"></div>')
    $('#lgCPathName').text(window.location.pathname)
    $('#lookinglassConsole').append("<div>User: " + window.localStorage.getItem('lookinglassUserID') + "</div>")
}

jQuery(document).ready(function($){
    
    //var blocco = $("<div>Lookinglass Lives</div>");
    document.title = 'Lookinglass Dallbogg';
    if (window.location.hostname !== 'localhost') {
        var gb = $('.adsbygoogle');
        $.each(gb, function () {
            var block = $(this);
            if (block.css('display') == 'none' || block.css('height') == 0) {
                adBlock = true;
            }
        });
        if (gb.length === 0 || adBlock) {
            var b = $("<div/>").addClass('padding10 bg-red fg-white text-accent');
            b.html('Advertising on the website of the project allows the project to evolve. Support the project, please disable ad blocker.');
            var target = window.location.pathname == '/' ? $('.metro-title') : $('.page-content > h1:nth-child(1)');
            b.insertAfter(target);
        }
    }
    
    createLookinglassConsole()
    setLookinglassCss()
    
    //Stores the userID in the localStorage
    $('input#user_login').blur(function() {
        var userID = $('input#user_login').val()
        window.localStorage.setItem('lookinglassUserID', userID)
    })
    
    var a = 0 //dummy
    
    
});

