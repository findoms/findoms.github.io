(function(l){function u(d,b,f){var m=0,e=[];f=jQuery.makeArray(f||d.querySelectorAll(b.itemSelector));var p=f.length,h=d.getBoundingClientRect();d=Math.floor(h.right-h.left)-parseFloat(l(d).css("padding-left"))-parseFloat(l(d).css("padding-right"));for(var h=[],c,g,n,a=0;a<p;++a)(c=f[a].getElementsByTagName("img")[0])?((g=parseInt(c.getAttribute("width")))||c.setAttribute("width",g=c.offsetWidth),(n=parseInt(c.getAttribute("height")))||c.setAttribute("height",n=c.offsetHeight),h[a]={width:g,height:n}):
(f.splice(a,1),--a,--p);p=f.length;for(c=0;c<p;++c){f[c].classList?(f[c].classList.remove(b.firstItemClass),f[c].classList.remove(b.lastRowClass)):f[c].className=f[c].className.replace(new RegExp("(^|\\b)"+b.firstItemClass+"|"+b.lastRowClass+"(\\b|$)","gi")," ");m+=h[c].width;e.push(f[c]);if(c===p-1)for(a=0;a<e.length;a++)0===a&&(e[a].className+=" "+b.lastRowClass),e[a].style.cssText="width: "+h[c+parseInt(a)-e.length+1].width+"px;height: "+h[c+parseInt(a)-e.length+1].height+"px;margin-right:"+(a<
e.length-1?b.minMargin+"px":0);if(m+b.maxMargin*(e.length-1)>d){g=m+b.maxMargin*(e.length-1)-d;a=e.length;(b.maxMargin-b.minMargin)*(a-1)<g?(n=b.minMargin,g-=(b.maxMargin-b.minMargin)*(a-1)):(n=b.maxMargin-g/(a-1),g=0);for(var t,q=0,a=0;a<e.length;a++){t=e[a];var r=h[c+parseInt(a)-e.length+1].width,k=r-r/m*g,r=Math.round(h[c+parseInt(a)-e.length+1].height*(k/r));.5<=q+1-k%1?(q-=k%1,k=Math.floor(k)):(q+=1-k%1,k=Math.ceil(k));t.style.cssText="width: "+k+"px;height: "+r+"px;margin-right: "+(a<e.length-
1?n:0)+"px";0===a&&(t.className+=" "+b.firstItemClass)}e=[];m=0}}}l.fn.rowGrid=function(d){return this.each(function(){$this=l(this);if("appended"===d){d=$this.data("grid-options");var b=$this.children("."+d.lastRowClass),b=b.nextAll(d.itemSelector).add(b);u(this,d,b)}else if(d=l.extend({},l.fn.rowGrid.defaults,d),$this.data("grid-options",d),u(this,d),d.resize)l(window).on("resize.rowGrid",{container:this},function(b){u(b.data.container,d)})})};l.fn.rowGrid.defaults={minMargin:null,maxMargin:null,
resize:!0,lastRowClass:"last-row",firstItemClass:null}})(jQuery);