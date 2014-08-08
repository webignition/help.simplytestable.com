String.prototype.hashCode = function(){
    var hash = 0, i, char;
    if (this.length == 0) return hash;
    for (i = 0; i < this.length; i++) {
        char = this.charCodeAt(i);
        hash = ((hash<<5)-hash)+char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
};

$(document).ready(function() {
    $('body.toc .post').each(function () {
        var headings = $('h2', this);
        if (headings.length === 0) {
            return;
        }
        
        var tocList = $('<ul class="sidebar-list list-unstyled link-list nav" />');
        
        headings.each(function (index) {
            var thisHeading = $(this);
            var headingId = 'h' + thisHeading.text().hashCode();

            thisHeading.attr('id', headingId);

            var listItem = $('<li><a href="#'+headingId+'">'+thisHeading.text()+'</a></li>');

            if (index === 0) {
                listItem.addClass('active');
            }
            
            tocList.append(listItem);
        });
        
        var sidebarItem = $('<div class="toc-container" />');
        sidebarItem.append('<h3>In this document</h3>');
        sidebarItem.append(tocList);
        
        $('.sidebar').append(sidebarItem);

        sidebarItem.affix({
            offset: {
                top: 212
            }
        });
        
    });

    $('.toc-container a').click(function () {
        var target = $(this.hash);

        if (target.length) {
            if ($('html').is('.history')) {
                history.pushState(null, null, this.hash);
            }

            var offset = 80;

            $('html,body').animate({
                scrollTop: (target.offset().top) - offset
            }, 400);

            return false;
        }

        return false;
    });

    $('body').scrollspy({
        target: '.toc-container',
        offset: 90
    });

    if ($(window.location.hash).length) {
        var target = $(window.location.hash);

        if (target.length) {
            $('html,body').animate({
                scrollTop: (target.offset().top) - 80
            }, 400);
        }
    }
});