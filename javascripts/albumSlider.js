/* Options:
    1. viewportSize: 3 //How many items should be visible in the slideshow
    2. focusedHeight: '100%'
      Height of item in focus
    3. focusedWidth: '100%'
      Width of item in focus
    4. secondTierHeight: '75%' 
      Height of the item directly to the left & right of the current element.
      As an int: Height in px of the element.
      As a percentage: Height as a percentage of the current element's height.
    5. secondTierWidth: '75%' // Width of the item directly to the left & right of the current element
      Width of the item directly to the left & right of the current element.
      As an int: Width in px of the element.
      As a percentage: Width as a percentage of the current element's width.
    7. otherTierHeight: '90%'
      Height of non-current and non-second-tier items.
      As an int: Height in px of the element.
      As a percentage: Height as a percentage of the item's larger sibling's width (higher tier).
    8. otherTierWidth: '90%'
      Width of non-current and non-second-tier items.
      As an int: Width in px of the element.
      As a percentage: Width as a percentage of the item's larger sibling's width (higher tier).
    9. itemSelector: 'li'
      The css selector for child items to be included in the slideshow
    10. duration: 500
      The total animation time for transitions
    11. startZIndex: 500
      The ZIndex of the focal item. Items in other tiers decrement this number by 1.
    12. tierCss: {}
      Assign Css attributes to slideshow elements by tier -- e.g:
      { 1: {margin-top: '10px'},
        2: {margin-top: '20px'}}
*/

(function( $, undefined ) {
  $.widget("ui.albumSlider", {
    options: {
      startIndex: 1, //Not implemented yet
      viewportSize: 3,
      focusedHeight: '100%',
      focusedWidth: '100%',
      secondTierHeight: '75%',
      secondTierWidth: '75%',
      otherTierHeight: '90%',
      otherTierWidth: '90%',
      itemSelector: 'li',
      duration: 500,
      startZIndex: 500,
      tierCss: {}
    },

    _create: function() {
      var items = [],
      attributes,
      totalItems = 0,
      floorIndex = 0,
      container = $(this.element);

      items = container.children();
      // We're gonna add these elements back in once the viewport is ready
      $(items).hide();

      totalItems = items.size();

      this.focalIndex = Math.floor(totalItems/2.0);
      if (totalItems < this.options.viewportSize) { this.options.viewportSize = totalItems; }

      this.attributes = attributes = new Array(totalItems);

      var leftTotal = Math.ceil((this.options.viewportSize - 1)/2.0); //subtracting one because the focus item shouldn't count
      this.leftViewportEdge = this.focalIndex - leftTotal;

      var rightTotal = Math.floor((this.options.viewportSize - 1)/2.0);
      this.rightViewportEdge = this.focalIndex + rightTotal;

      this.calculateSizes(totalItems, rightTotal, leftTotal, attributes);
      this.showViewport(items, attributes, container);

      // We need to have access to 'this' in the click binding
      var slider = this;

      // For locking the slider
      slider.isLocked = false;

      $('#'+container.attr('id')+' '+this.options.itemSelector).live('click', function() {
        if (slider.isLocked) { return; }
        var clickedItem = $(this);

        slider.isLocked = true;
        if ($(this) != items[slider.focalIndex]){

          var clickedIndex;

          $.each(items, function(i, v) {
            if ($(v).is(clickedItem)){
              clickedIndex = i;
            }
          });

          // Total animation divided by number of images to rotate
          var itemsToRotate = Math.abs(clickedIndex-slider.focalIndex);
          var duration = slider.options.duration/itemsToRotate;
          var timeout = 0;
          while(itemsToRotate>0){
            // Queue up the animations using setTimeout
            // Note: the first rotation has a timeout of 0
            setTimeout(function(){slider.animate(items, clickedIndex, container, duration);}, timeout);
            timeout += duration; // need to increment timeout by duration chunks so slider plays sequentially
            itemsToRotate--;
          }
        }
        setTimeout(function() { slider.isLocked = false; }, slider.options.duration);
      });
    },

    // Note: sizes outside of the viewport edges are calculated, but not applied to any elements.
    // Elements outside of the viewport get the same attributes as viewport edge elements
    calculateSizes: function(totalItems, rightTotal, leftTotal, attributes){
      if (totalItems > 0) { 
        attributes[this.focalIndex] = this.buildAttributeNode(this.options.focusedHeight, this.options.focusedWidth, 'focus'); 
      }

      // Right 2ndTier
      if (rightTotal > 0) {
        attributes[this.focalIndex+1] = this.buildAttributeNode(this.options.secondTierHeight, this.options.secondTierWidth, 'right', attributes[this.focalIndex]);
      }

      // Right otherTier
      for (i=this.focalIndex+2; i<totalItems; i++){
        attributes[i] = this.buildAttributeNode(this.options.otherTierHeight, this.options.otherTierWidth, 'right', attributes[i-1]);
      }

      // Left 2ndTier
      if (leftTotal > 0) {
        attributes[this.focalIndex-1] = this.buildAttributeNode(this.options.secondTierHeight, this.options.secondTierWidth, 'left', attributes[this.focalIndex]);
      }

      // Left otherTier
      for(i=this.focalIndex-2; i>=0; i--){
        attributes[i] = this.buildAttributeNode(this.options.otherTierHeight, this.options.otherTierWidth, 'left', attributes[i+1]);
      }
    },

    showViewport: function(items, attributes, container) {
      var slider = this;
      $.each(items, function(i, item) {
        if (i>=slider.leftViewportEdge && i<=slider.rightViewportEdge) {
          slider.assignAttributes(item, attributes[i]);
          $(item).show();
        } else {
          // Hidden images should have same attributes as the edge of the viewport
          slider.assignAttributes(item, attributes[slider.rightViewportEdge]);
          $(item).css({width: 0}); // want no width for hidden elements
        }
      });
    },

    // Requires a duration if there's an animation
    assignAttributes: function(item, attributes, animate, duration) {
      var tier = attributes['data-tier'];
      $(item).attr('data-tier', tier);
      $(item).attr('data-side', attributes['data-side']);
      $(item).css('z-index', attributes['z-index']);

      var transitionValues = {height: attributes.height, width: attributes.width};

      if (this.options.tierCss[tier]){
        $.extend(transitionValues, this.options.tierCss[tier]);
      }

      if (animate){
        $(item).animate(transitionValues, {
          'duration': duration,
          complete: function() {
            $(item).css({'overflow-x': '', 'overflow-y': '' });
          }
        });
        // The animate function leaves overflow css on element when doing multiple transitions.
        // Will remove them here.
      }else{
        $(item).css(transitionValues);
      }
    },

    buildAttributeNode: function(h, w, clickSide, greaterAttributeNode) {
      if (typeof w == 'number') { w = w + 'px'; }

      var tier = 1; // Default to tier 1 unless a greater attribute node is given
      var z_index = this.options.startZIndex;

      if (greaterAttributeNode) {
        tier = greaterAttributeNode['data-tier'] + 1;
        z_index = greaterAttributeNode['z-index'] - 1;
      }

      return {
        height: this.calculateSize(h, 'height', greaterAttributeNode), 
        width: this.calculateSize(w, 'width', greaterAttributeNode),
        'data-side': clickSide,
        'data-tier': tier,
        'z-index': z_index
      };
    },

    // greaterAttributeNode is a higher-tier node used to calculate relative sizes (if % is specified)
    // attribute is either 'height', 'width', or 'margin-bottom'
    calculateSize: function(size, attribute, greaterAttributeNode) {
      if (typeof size == 'number') { 
        return size + 'px'; 
      } else if (/\%/.exec(size) && greaterAttributeNode) {
        var percentage = this.percentageOfGreaterNode(size, attribute, greaterAttributeNode);
        return percentage.value + percentage.unit;
      } else {
        return size; //assumed to be a percentage for the 'focused' node
      }
    },

    percentageOfGreaterNode: function(size, attribute, greaterAttributeNode) {
      // This is a percentage of a greaterAttributeNode
      greaterSize = greaterAttributeNode[attribute];

      // maintain greater node's unit type
      var unit = (/\%/.exec(greaterSize)) ? '%' : 'px'
      return {value: (parseInt(greaterSize)*parseInt(size)/100.0), 'unit': unit};
    },

    animate: function(items, clickedIndex, container, duration) {
      // Which side of the focal point was clicked
      var clickSide = (clickedIndex > this.focalIndex) ? 'right' : 'left';

      var viewportShowsAllItems = this.options.viewportSize == items.length;
      var transitionElements = this.rearrangeViewport(items, clickSide);

      // Going to hide the element by animating margin & setting the z-index to a value that results
      // in the element getting hidden behind the slider
      $(transitionElements.toHide).addClass('album-slider-hiding').animate({width: '0px'}, {
        direction: clickSide,
        'duration':duration, 
        complete: function(){
          if (viewportShowsAllItems) {
            $(this).remove();
          } else {
            $(this).removeClass('album-slider-hiding');
          }
        }
      });
      if (clickSide == 'right'){
        container.append($(transitionElements.toShow));
      }else{
        container.prepend($(transitionElements.toShow));
      }

      for (i=this.leftViewportEdge; i<=this.rightViewportEdge; i++){
        $(items[i]).show();
        this.assignAttributes($(items[i]), this.attributes[i], true, duration);
      }
    },

    // Shift the viewport left or right
    // returns elements to be hidden & shown
    rearrangeViewport: function(items, clickSide) {
      var oldItems = items.slice(0); // Using slice to clone the array
      var newIndex, indexToShow, indexToHide, toHide, toShow, toShowIndex;

      if (clickSide == 'left') {
        // Shift all values to the right (giving the illusion that we're moving left)
        $.each(oldItems, function(i, v) {
          if (i==items.length-1){
            items[0] = v;
          }else{
            items[i+1] = v;
          }
        });

        toShow = items[this.leftViewportEdge];
        toHide = oldItems[this.rightViewportEdge];
        
        toShowIndex = this.leftViewportEdge;
      }else{
        // Shift all values to the left (giving the illusion that we're moving right)
        $.each(oldItems, function(i, v) {
          if (i==0){
            items[items.length-1] = v;
          }else{
            items[i-1] = v;
          }
        });

        toShow = items[this.rightViewportEdge];
        toHide = oldItems[this.leftViewportEdge];

        toShowIndex = this.rightViewportEdge;
      }

      // We want the item we're hiding to have a z-index lower than every other item in the viewport.
      // Otherwise we run into funky problems.
      $(toHide).css('z-index', this.options.startZIndex - items.length);

      if (this.options.viewportSize == items.length) {
        toShow = $(toHide).clone().css({width: 0});
        items[toShowIndex] = toShow;
      }

      return {'toShow': toShow, 'toHide': toHide};
    }
  });
})(jQuery);
