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
        
        var tocList = $('<ul class="sidebar-list list-unstyled link-list" />');
        
        headings.each(function () {
            var thisHeading = $(this);
            var headingId = 'h' + thisHeading.text().hashCode();
            var idElement = $('<span class="target" id="'+headingId+'" />');
            
            thisHeading.before(idElement);
            
            //thisHeading.attr('id', headingId);
            
            tocList.append($('<li><a href="#'+headingId+'">'+thisHeading.text()+'</a></li>'));
        });
        
        var sidebarItem = $('<div class="toc-container" />');
        sidebarItem.append('<h3>In this document</h3>');
        sidebarItem.append(tocList);
        
        $('.sidebar').append(sidebarItem);
        
    });
});