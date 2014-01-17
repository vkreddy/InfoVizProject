function getMoviesInTheaters() {
	// send off the query
	var movieData = [];
	$.ajax({
		url: "/php/in_theaters.php",
		dataType: "json",
		success: function(data){			
			movieData = data;
		},
		async: false
	})
	
	return movieData
}

// gets box office data
function getBoxOfficeData(imdbid, movieName){
      var lastweekend = "";
      var gross = "";
      var opening = "";
      var bomojoinfo = 0;
      $.ajax({
        url: "php/scraper2.php",
        success: function(data) {
              //matches just the table
              var subset = data.match(/Week #[^]+TOTAL/);
              //finds the movie
              movieName = movieName.replace("&", "and"); // Rotten Tomatoes uses "&", while boxofficmojo uses "and"
              // Get the info for your movie
              var movieSearch = new RegExp('htm"><b>'+movieName+'[^]+?center');
              //Extract weekend and gross from the data
              var sub2 = subset[0].match(movieSearch);
              if (!sub2){
                var bomojoinfo = 0;
              } else{
                var bomojoinfo = 1;
                var sub3 = sub2[0].match(/2">[^]+?<\/font>/g);
                lastweekend = sub3[1];
                gross = sub3[6];
                lastweekend = lastweekend.replace('2"><b>', "");
                lastweekend = lastweekend.replace('</b></font>', "");
                gross = gross.replace('2">', "");
                gross = gross.replace('</font>', "");			
              }
              // Pull additional data from IMDB
              $.ajax({
                url: "php/scraper.php?imdbid=tt" + imdbid + " #tn15content",
                success: function(data) {
                  //get relevant subset from whole string
                  var subset = data.match(/Opening(.|\n)*?Related/);
                  // If the scraper doesn't have the appropriate information
                  if (!subset){
                    var imdbinfo = 0;
                    console.log("no subset");
                  } else {
                    var subsetnon = subset[0].replace(/(\r\n|\n|\r)/gm,"");
                    //pull opening weekend data
                    var openingM = subsetnon.match(/Opening.*?USA/);
                    // If the IMDB site does not have the box office information, pull the information from boxofficemojo
                    if(!openingM){
                        var imdbinfo = 0;
                        console.log("no opening");
                    } else {
                        var imdbinfo = 1;
                        // code is modified to leave dollar sign
                        var opening1 = openingM[0].replace("Opening Weekend</h5>",""); 
                        // This used to be opening2. modified to leave commas
                        opening = opening1.replace(" (USA",""); 

                        var grossM = subsetnon.match(/Gross.*?USA/);
                        var gross1 = grossM[0].replace("Gross</h5>","");
                        var imdbgross = gross1.replace(" (USA","");
                        //pull last weekend
                        var lastweekendM = subsetnon.match(/Weekend Gross.*?USA/);
                        var lastweekend1 = lastweekendM[0].replace("Weekend Gross</h5>","");
                        var imdblastweekend = lastweekend1.replace(" (USA","");
                        //console.log the important data. these are strings at the moment.
                        if (bomojoinfo == 0){
                            lastweekend = imdblastweekend;
                            gross = imdbgross;
                        }
                    }
                  }
                },
                async: false
            }); // end of scraper ajax
          
            if (opening == ""){
                opening = lastweekend;
            }
          
            console.log("opening:", opening);
            $("#boxoffice").html("<h4>Box Office</h4><p>Last Weekend: "+lastweekend+
                            "<br>Opening Weekend: "+opening+"<br>Gross: "+gross+"</p>");
        },
        async:false
      }); // end of scraper2 ajax
	  
	  opening = parseFloat(opening.replace("$","").replace(",",""));
	  lastweekend = parseFloat(lastweekend.replace("$","").replace(",",""));
	  gross = parseFloat(gross.replace("$","").replace(",",""));
	  return { "opening": opening, "gross": gross, "lastweekend": lastweekend}
}


function getCombineData() {
	var data = getMoviesInTheaters();
	var val = { "opening": 0, "gross": 0, "lastweekend": 0};
	for(var i=0;i<data.movies.length;i++){		
		if (data.movies[i].alternate_ids != null && data.movies[i].alternate_ids.imdb != null) {
			val = getBoxOfficeData(data.movies[i].alternate_ids.imdb, data.movies[i].title);
		}		
		data.movies[i].boxoffice = val;
	}
	
	return data;
}

function getMovieDetails(movie){
	var selfurl = movie.links.self + "?apikey=bq2gvg6a4zv8ac366yq676uu&limit=20&callback=?";
	$.getJSON(selfurl, function(json){
        // get directors and genres
		movie.abridged_directors = json.abridged_directors;
		movie.genres = json.genres;
		outputData(movie);
	});
}

function outputData(movie){
	console.log(movie); // This is the movie data with genres and directors included
	$("#poster").html('<img src=' + movie.posters.detailed + '>')
	//Prepare the data for the info
	var genres = "";
	var directors = "";
	var actors = "";
	// put array datas into single strings
	for (var i=0; i < movie.genres.length; i++){
        genres = genres + movie.genres[i] + ", ";
	}
	genres = genres.substring(0, genres.length - 2); // remove last ", ""
	for (var i=0; i<movie.abridged_directors.length; i++){
        directors = directors + movie.abridged_directors[i].name + "<br>";
	}
	directors = directors.substring(0, directors.length - 4);
	for (var i=0; i<movie.abridged_cast.length; i++){
        actors = actors + movie.abridged_cast[i].name + "<br>";
	}
	actors = actors.substring(0, actors.length - 4);
	$("#movietitle").html(movie.title);
	$("#info").html('<p>'+movie.mpaa_rating+', '+movie.runtime+' min</p><p>'+ 
                genres+'</p><p><b>Director:</b><br>'+directors+'</p><p><b>Cast:</b><br>'+actors+'</p>');
	
	$("#synopsis").html(movie.synopsis);
	// get movie db id to get the movie trailer
	getmoviedbid(movie.alternate_ids.imdb);
	ratingGraphs(movie.ratings.critics_score, movie.ratings.audience_score);
	getBoxOfficeData(movie.alternate_ids.imdb, movie.title);
}

function ratingGraphs(critic, audience){
	var valueLabelWidth = 40; // space reserved for value labels (right)
	var barHeight = 20; // height of one bar
	var barLabelWidth = 73; // space reserved for bar labels
	var barLabelPadding = 5; // padding between bar and bar labels (left)
	var gridLabelHeight = 18; // space reserved for gridline labels
	var gridChartOffset = 3; // space between start of grid and first bar
	var maxBarWidth = 200; // width of the bar with the max value

	var data = [{type: "Critic", rating: critic},{type:"Audience",rating:audience}];

	// accessor functions 
	var barLabel = function(d) { return d['type']; };
	var barValue = function(d) { return d['rating']; };

	// scales
	var yScale = d3.scale.ordinal().domain(d3.range(0, data.length)).rangeBands([0, data.length * barHeight]);
	var y = function(d, i) { return yScale(i); };
	var yText = function(d, i) { return y(d, i) + yScale.rangeBand() / 2; };
	var x = d3.scale.linear().domain([0, 100]).range([0, maxBarWidth]);
    
	// svg container element
	var chart = d3.select('#ratingsgraph').append("svg")
        .attr('width', maxBarWidth + barLabelWidth + valueLabelWidth)
        .attr('height', gridLabelHeight + gridChartOffset + data.length * barHeight);
        
	// grid line labels
	var gridContainer = chart.append('g')
        .attr('transform', 'translate(' + barLabelWidth + ',' + gridLabelHeight + ')'); 
        gridContainer.selectAll("text").data(x.ticks(2)).enter().append("text")
        .attr("x", x)
        .attr("dy", -3)
        .attr("text-anchor", "middle")
        .text(String);
        
	// vertical grid lines
	gridContainer.selectAll("line").data(x.ticks(10)).enter().append("line")
        .attr("x1", x)
        .attr("x2", x)
        .attr("y1", 0)
        .attr("y2", yScale.rangeExtent()[1] + gridChartOffset)
        .style("stroke", "#ccc");
	
    // bar labels
	var labelsContainer = chart.append('g')
        .attr('transform', 'translate(' + (barLabelWidth - barLabelPadding) + ',' + (gridLabelHeight + gridChartOffset) + ')'); 
        labelsContainer.selectAll('text').data(data).enter().append('text')
        .attr('y', yText)
        .attr('stroke', 'none')
        .attr('fill', 'black')
        .attr("dy", ".35em") // vertical-align: middle
        .attr('text-anchor', 'end')
        .text(barLabel);
	
    // bars
	var barsContainer = chart.append('g')
        .attr('transform', 'translate(' + barLabelWidth + ',' + (gridLabelHeight + gridChartOffset) + ')'); 
        barsContainer.selectAll("rect").data(data).enter().append("rect")
        .attr('y', y)
        .attr('height', yScale.rangeBand())
        .attr('width', function(d) { return x(barValue(d)); })
        .attr('stroke', 'white')
        .attr('fill', 'steelblue');
        
	// bar value labels
	barsContainer.selectAll("text").data(data).enter().append("text")
        .attr("x", function(d) { return x(barValue(d)); })
        .attr("y", yText)
        .attr("dx", 3) // padding-left
        .attr("dy", ".35em") // vertical-align: middle
        .attr("text-anchor", "start") // text-align: right
        .attr("fill", "black")
        .attr("stroke", "none")
        .text(function(d) { return d3.round(barValue(d), 2); });
        
	// start line
	barsContainer.append("line")
        .attr("y1", -gridChartOffset)
        .attr("y2", yScale.rangeExtent()[1] + gridChartOffset)
        .style("stroke", "#000");
}
	
// Gets the MovieDB ID from the IMDB ID
function getmoviedbid(imdbid){
	var url = "http://api.themoviedb.org/2.1/Movie.imdbLookup/en/json/7fb82754c80e3ab639fd76e14de06a48/tt" + imdbid;
	$.ajax(url, {
		crossDomain:true, 
		dataType: "jsonp", 
		success:function(data){
			getmoviedbdata(data[0].id);
		}
	});
}

// Gets data from the movie db
function getmoviedbdata(moviedbid){
	var trailerurl = "http://api.themoviedb.org/3/movie/" + moviedbid + 
                    "/trailers?api_key=7fb82754c80e3ab639fd76e14de06a48&callback=?"
	$.getJSON(trailerurl, function(json){
        // Puts the trailer into the HTML
		$("#trailer").html('<iframe width="475" height="267" src="http://www.youtube.com/embed/' + 
                            json.youtube[0].source + '" frameborder="0" allowfullscreen></iframe>');
	});
	$("#content").show();
}

$(document).ready(function () {

	// Added a little code to make the pills highlighted on load
	$('.dropdown').toggleClass('active');

	//Note: Change "getMoviesInTheaters()" to "getCombineData()" 
    //if you want the opening and gross data. Make changes in index.html accordingly
	var all_data = getMoviesInTheaters();	
	
	filter_movies = function() {
        return data = all_data.movies.filter(function(d) {			
            return d.ratings.critics_score > 10;
        });
    };
	
	filter_movies();
	
	var yScale, yScale_reverse, xScale, yVar, xAxis, yAxis, y_domain, movie_body, 
        option, body, yText, vis, fStartDate, fEndDate, genres;
	
	w = 908;
    h = 480;
	pt = 20, pr = 20, pb = 50, pl = 50;
	picSize = 80, pic_p = picSize / 2;
	
	genres = null;
	fStartDate = new Date(2013, 3, 20);
	fEndDate = new Date(2013, 4, 5);

	var formatNumber = d3.format(",d");
	
	// for cross filter functionality
	var movie = crossfilter(data),
		all = movie.groupAll(),
		date = movie.dimension(function(d) { return new Date(d.release_dates.theater); }),
		dates = date.group();
		
	//alert(data.movies[0].release_dates.theater);
    var x_domain = d3.extent(data, function(d) { return new Date(d.release_dates.theater); });
	
	var charts = [
		barChart()
			.dimension(date)
			.group(dates)
			.round(d3.time.day.round)
		  .x(d3.time.scale()
			.domain(x_domain)
			.rangeRound([0, 10 * 90]))
			.filter([fStartDate, fEndDate])
	];
       
    // display date format
    var date_format = d3.time.format("%b %d");

	var lower_date = new Date(date.bottom(1)[0].release_dates.theater);
		lower_date.setDate(lower_date.getDate() - 2)
		
	var upper_date = new Date(date.top(1)[0].release_dates.theater);
		upper_date.setDate(upper_date.getDate() + 1)
		
	xScale = d3.time.scale()
		.domain([lower_date, upper_date])    
		.range([0, w]);   

	// define the x axis
	var xAxis = d3.svg.axis()
		.orient("bottom")
		.scale(xScale)
		.ticks(10)
		.tickFormat(date_format);	
		
	filter_genres = function(genres) {
      if (genres != "All Genres") {
        return data = data.filter(function(d) {			
          return $.inArray(genres,d.genres) !== -1;
        });
      } else {
		return filter_movies();
	  }
    };	
	update_data = function() {
	  filter_movies();
      filter_genres(genres); 
    };
    
	function getYVal(movie) {
		switch (option) {
			case "Critics Rating":
				return movie.ratings.critics_score; 
				break;
			case "Audience Rating":
				return movie.ratings.audience_score;
				break;
			case "Opening Weekend":					
				return (movie.boxoffice.opening / 1000);
				break;
			case "Gross":
				return (movie.boxoffice.gross / 1000);
				break;
		}
	}
	update_yaxis = function() {			
		y_domain = d3.extent(data, function(d) { 
			return getYVal(d)
		});
		
		// define the y scale  (vertical)
		yScale = d3.scale.linear()
			.domain([0,120])    
			.range([0, h]);
		
		yScale_reverse = d3.scale.linear()
			.domain(y_domain.reverse())    
			.range([0, h]);
			
		yAxis = d3.svg.axis()
			.scale(yScale_reverse)
			.ticks(10).orient("left");
		
		switch (option) {
            case "Critics Rating":
                yText = "Critics Rating (Rotten Tomatoes)";
                break;
            case "Audience Rating":
                yText = "Audience Score (Rotten Tomatoes)"; 
                break;
            case "Opening Weekend":
                yText = "Opening Weekend ($ in 000's)"; 
                break;
            case "Gross":
                yText = "Gross($ in 000's)"; 
                break;
		}		
	}
	draw_movies = function() {
        var movies;	
        movies = movie_body.selectAll(".movie").data(data, function(d) {
            return d.id;
        }); 
        
        movies.enter().append("g").attr("class", "movie")
            .on("mouseover", function(d, i) {
                return show_details(d, i, this); })
            .on("mouseout", hide_details)
            .on("click", function(d) {
                $( "#dialog" ).show();
                
                $( "#closebutton" ).click(function() {
                    $("#content").hide();
                    $("#dialog").hide();
                    $("#trailer").html("");
                    $("#movietitle").html("");
                    $("#poster").html("");
                    $("#info").html("");
                    $("#ratingsgraph").html("");
                    $("#boxoffice").html("");
                    $("#synopsis").html("");
                });

                $( "#dialog" ).click(function() {
                    $("#content").hide();
                    $("#dialog").hide();
                    $("#trailer").html("");
                    $("#movietitle").html("");
                    $("#poster").html("");
                    $("#info").html("");
                    $("#ratingsgraph").html("");
                    $("#boxoffice").html("");
                    $("#synopsis").html("");
                });
                
                return getMovieDetails(d);
            }).append("svg:image")
                .attr("transform", "rotate(180)")
                .attr("xlink:href", function(d) { return d.posters.thumbnail; })
                .attr("width", picSize + "px")
                .attr("height", picSize + "px");
		
        movies.transition().duration(1000).attr("transform", function(d) {						
			return "translate(" + (xScale(new Date(d.release_dates.theater)) + 
                    pic_p - 80) + "," + (yScale(getYVal(d)) + pic_p) + ")scale(-1,1)"
        });
		
        base_vis.transition().duration(1000).select(".y_axis").call(yAxis);   

        movies.exit().transition().duration(1000).attr("transform", function(d) {
        return "translate(" + 0 + "," + 0 + ")";
        }).remove();
	}
	redraw_movies= function() {
		movies = movie_body.selectAll(".movie").data(data, function(d) {
			return d.id;
		});
				
		movies.transition().duration(1000).attr("transform", function(d) {	
			return "translate(" + (xScale(new Date(d.release_dates.theater)) + pic_p - 80) + 
                    "," + (yScale(getYVal(d)) + pic_p) + ")scale(-1,1)"			
		});
	  
		base_vis.transition().duration(1000).select(".y_axis").call(yAxis);
		vis.select("text").text(yText);
	}
	show_details = function(movie_data, index, element) {
        var bBox, box, crosshairs_g, movies, msg, selected_movie, tooltipWidth, unselected_movies;
        movies = body.selectAll(".movie");
        bBox = element.getBBox();
        box = {
            "height": Math.round(bBox.height),
            "width": Math.round(bBox.width),
            "x": w + bBox.x,
            "y": h + bBox.y
        };
        box.x = Math.round(xScale(new Date(movie_data.release_dates.theater)) - (pr + 50) + 25);
        box.y = Math.round(yScale_reverse(getYVal(movie_data)) + pt - 30);
        tooltipWidth = parseInt(d3.select('#tooltip').style('width').split('px').join(''));
        
        msg = '<p class="title">' + movie_data.title + '</p>';
        msg += '<table>';
        msg += '<tr><td>Release Date:</td><td>' + date_format(new Date(movie_data.release_dates.theater)) + '</td></tr>';
        msg += '<tr><td>'+ option +':</td><td>' + getYVal(movie_data) + ' </td></tr>';
        msg += '<tr><td>Genres:</td><td>' + movie_data.genres.join() + ' </td></tr>';
        msg += '</table>';
        
        d3.select('#tooltip').classed('hidden', false);
        d3.select('#tooltip .content').html(msg);
        d3.select('#tooltip').style('left', "" + box.x + "px").style('top', "" + (box.y - box.height / 2) + "px");
        
        selected_movie = d3.select(element);
        selected_movie.attr("opacity", 1.0);
        
        unselected_movies = movies.filter(function(d) {
            return d.id !== movie_data.id;
        }).selectAll("image").attr("opacity", 0.2);
        
        crosshairs_g = body.insert("g", "#movies").attr("id", "crosshairs");
        crosshairs_g.append("line").attr("class", "crosshair").attr("x1", 0 + 3)
                    .attr("x2", xScale(new Date(movie_data.release_dates.theater)))
                    .attr("y1", yScale(getYVal(movie_data))).attr("y2", yScale(getYVal(movie_data)))
                    .attr("stroke-width", 1);
                    
        return crosshairs_g.append("line").attr("class", "crosshair")
                .attr("x1", xScale(new Date(movie_data.release_dates.theater)))
                .attr("x2", xScale(new Date(movie_data.release_dates.theater))).attr("y1", 0 + 3)
                .attr("y2", yScale(getYVal(movie_data))).attr("stroke-width", 1);
    };
	hide_details = function(movie_data) {
        var movies;
        d3.select('#tooltip').classed('hidden', true);
        movies = body.selectAll(".movie").selectAll("image").attr("opacity", 1);
        return body.select("#crosshairs").remove();
    };
	
	render_vis = function() {      
        base_vis = d3.select(".vis").append("svg").attr("width", w + (pl + pr)).attr("height", h + (pt + pb)).attr("id", "vis-svg");   
        base_vis.append("g").attr("class", "x_axis").attr("transform", "translate(" + pl + "," + (h + pt) + ")").call(xAxis);
        base_vis.append("text").attr("x", w / 2).attr("y", h + (pt + pb) - 10).attr("text-anchor", "middle")
                .attr("class", "axisTitle").attr("transform", "translate(" + pl + ",0)").text("Release Date");
        base_vis.append("g").attr("class", "y_axis").attr("transform", "translate(" + pl + "," + pt + ")").call(yAxis);
        
        vis = base_vis.append("g").attr("transform", "translate(" + 0 + "," + (h + (pt + pb)) + ")scale(1,-1)");
        vis.append("text").attr("x", h / 2).attr("y", 20).attr("text-anchor", "middle").attr("class", "axisTitle")
                .attr("transform", "rotate(270)scale(-1,1)translate(" + pb + "," + 0 + ")").text(yText);
        
        body = vis.append("g").attr("transform", "translate(" + pl + "," + pb + ")").attr("id", "vis-body");
        movie_body = body.append("g").attr("id", "movies");
        draw_movies();            
    };

	var chart = d3.selectAll(".chart")
      .data(charts)
      .each(function(chart) { chart.on("brush", renderAll).on("brushend", renderEnd); 
    });
	  
	renderAll();
	
	// Renders the specified chart or list.
	function render(method) {
		d3.select(this).call(method);
	}
	
	function update_date() {
		d3.select("#active").text(formatNumber(all.value()));
	}
    
	// Whenever the brush moves, re-rendering everything.
	function renderAll() {
		chart.each(render);	
	}
	
	function renderEnd() {	
		update_xaxis();		
		redraw_movies();
	}
	
	function update_xaxis() {
		var lower_date = new Date(date.bottom(1)[0].release_dates.theater);
		lower_date.setDate(lower_date.getDate() - 2)
		
		var upper_date = new Date(date.top(1)[0].release_dates.theater);
		upper_date.setDate(upper_date.getDate() + 1)
		
		xScale = d3.time.scale()
			.domain([lower_date, upper_date])    
			.range([0, w]); 
			
		xAxis = d3.svg.axis()
			.orient("bottom")
			.scale(xScale)
			.ticks(10)
			.tickFormat(date_format);
			
		base_vis.transition().duration(1000).select(".x_axis").call(xAxis);
	}
	
	window.filter = function(filters) {
		filters.forEach(function(d, i) { charts[i].filter(d); });
		renderAll();
	};

	window.reset = function(i) {
		charts[i].filter(null);
		renderAll();
	};
	
	function barChart() {
        if (!barChart.id) barChart.id = 0;

        var margin = {top: 10, right: 10, bottom: 20, left: 10},
            x = d3.scale.linear().range([0, w]),
            y = d3.scale.linear().range([100, 0]),
            id = barChart.id++,
            axis = d3.svg.axis().orient("bottom"),
            brush = d3.svg.brush(),
            brushDirty,
            dimension,
            group,
            round;

        function chart(div) {
            var width = x.range()[1],
                height = y.range()[0];

            y.domain([0, group.top(1)[0].value]);

            div.each(function() {
            var div = d3.select(this),
                g = div.select("g");

            // Create the skeletal chart.
            if (g.empty()) {
                div.select(".title").append("a")
                  .attr("href", "javascript:reset(" + id + ")")
                  .attr("class", "reset")
                  .text("reset")
                  .style("display", "none");

                g = div.append("svg")
                  .attr("width", w + margin.left + margin.right)
                  .attr("height", height + margin.top + margin.bottom)
                .append("g")
                  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                g.append("clipPath")
                  .attr("id", "clip-" + id)
                  .append("rect")
                  .attr("width", width)
                  .attr("height", height);

                g.selectAll(".bar")
                  .data(["background", "foreground"])
                .enter().append("path")
                  .attr("class", function(d) { return d + " bar"; })
                  .datum(group.all());

                g.selectAll(".foreground.bar")
                  .attr("clip-path", "url(#clip-" + id + ")");

                g.append("g")
                  .attr("class", "axis")
                  .attr("transform", "translate(0," + height + ")")
                  .call(axis);

                // Initialize the brush component with pretty resize handles.
                var gBrush = g.append("g").attr("class", "brush").call(brush);
                gBrush.selectAll("rect").attr("height", height);
                gBrush.selectAll(".resize").append("path").attr("d", resizePath);
            }

            // Only redraw the brush if set externally.
            if (brushDirty) {
                brushDirty = false;
                g.selectAll(".brush").call(brush);
                div.select(".title a").style("display", brush.empty() ? "none" : null);
                if (brush.empty()) {
                g.selectAll("#clip-" + id + " rect")
                    .attr("x", 0)
                    .attr("width", width);
                } else {
                    var extent = brush.extent();
                    g.selectAll("#clip-" + id + " rect")
                        .attr("x", x(extent[0]))
                        .attr("width", x(extent[1]) - x(extent[0]));
                }
            }

            g.selectAll(".bar").attr("d", barPath);
          });

          function barPath(groups) {
            var path = [],
                i = -1,
                n = groups.length,
                d;
            while (++i < n) {
              d = groups[i];
              path.push("M", x(d.key), ",", height, "V", y(d.value), "h9V", height);
            }
            return path.join("");
          }

          function resizePath(d) {
            var e = +(d == "e"),
                x = e ? 1 : -1,
                y = height / 3;
            return "M" + (.5 * x) + "," + y
                + "A6,6 0 0 " + e + " " + (6.5 * x) + "," + (y + 6)
                + "V" + (2 * y - 6)
                + "A6,6 0 0 " + e + " " + (.5 * x) + "," + (2 * y)
                + "Z"
                + "M" + (2.5 * x) + "," + (y + 8)
                + "V" + (2 * y - 8)
                + "M" + (4.5 * x) + "," + (y + 8)
                + "V" + (2 * y - 8);
          }
        }

        brush.on("brushstart.chart", function() {
            var div = d3.select(this.parentNode.parentNode.parentNode);
            div.select(".title a").style("display", null);
        });

        brush.on("brush.chart", function() {
            var g = d3.select(this.parentNode),
              extent = brush.extent();
              
            if (round) g.select(".brush")
              .call(brush.extent(extent = extent.map(round)))
              .selectAll(".resize")
              .style("display", null);
              
            g.select("#clip-" + id + " rect")
              .attr("x", x(extent[0]))
              .attr("width", x(extent[1]) - x(extent[0]));
              
            dimension.filterRange(extent);
        });

        brush.on("brushend.chart", function() {
            if (brush.empty()) {
                var div = d3.select(this.parentNode.parentNode.parentNode);
                div.select(".title a").style("display", "none");
                div.select("#clip-" + id + " rect").attr("x", null).attr("width", "100%");
                dimension.filterAll();
            }
        });

        chart.margin = function(_) {
          if (!arguments.length) return margin;
          margin = _;
          return chart;
        };

        chart.x = function(_) {
          if (!arguments.length) return x;
          x = _;
          axis.scale(x);
          brush.x(x);
          return chart;
        };

        chart.y = function(_) {
          if (!arguments.length) return y;
          y = _;
          return chart;
        };

        chart.dimension = function(_) {
          if (!arguments.length) return dimension;
          dimension = _;
          return chart;
        };

        chart.filter = function(_) {
          if (_) {
            brush.extent(_);
            dimension.filterRange(_);
          } else {
            brush.clear();
            dimension.filterAll();
          }
          brushDirty = true;
          return chart;
        };

        chart.group = function(_) {
          if (!arguments.length) return group;
          group = _;
          return chart;
        };

        chart.round = function(_) {
          if (!arguments.length) return round;
          round = _;
          return chart;
        };

        return d3.rebind(chart, brush, "on");
    }
  
	$("#dialog").hide();
    $("#content").hide();
	option = "Critics Rating";
	$("#rating_choice .dropdown-toggle:first-child").text(option);
	$("#rating_choice .dropdown-toggle:first-child").val(option);	
	update_yaxis();
	render_vis();
	
	function add_genres() {
		var html = "";
		for(key in all_data.genres) {
			html += '<li data-filter-camera-type="all"><a data-toggle="tab" href="#">' + all_data.genres[key] +'</a></li>';
		}
		$("#genres .dropdown-menu").append(html);
	}
	
	add_genres();
	
	$("#genres .dropdown-menu li a").click(function(){
		$("#genres .dropdown-toggle:first-child").text($(this).text());
		$("#genres .dropdown-toggle:first-child").val($(this).text());	  	  		
		genres = $(this).text();			
		update_data();	
		update_yaxis();
		draw_movies();
	});
	
	$("#rating_choice .dropdown-menu li a").click(function(){
		$("#rating_choice .dropdown-toggle:first-child").text($(this).text());
		$("#rating_choice .dropdown-toggle:first-child").val($(this).text());	  	  		
		option = $(this).text();			
		update_yaxis();
		redraw_movies();
	});	
});

