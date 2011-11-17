function show_loading(){
  //Clear the display divs and show loading gif
  $('#content-main').html("<div id='loading' style='margin:0 auto; padding-top:20px;'><center><span style='font-weight:200; font-size:200%;'>Loading...</span><br/><img height='32' width='32' src='./assets/images/loading.gif' alt='' /></center></div>");
  $('#errors').html("");
  $('#container').html("");
  $('#container2').html("");
  $('#container3').html("");
}

function hide_loading(){
  //Hide loading div after page loads
  $('#loading').html("")
}

function show_charts(params, dname, pname, wname){
  //Testperf Charts (DiskIOs and Pagefaults)
  show_loading(); //Show loading div to keep user happy

  //Build Resource URL
  var resourceURL = 'api/perfdata/' + 
    Object.keys(params).filter(function(name) {
      return (params[name] !== "any");
    }).map(function(name) {
      return name + "=" + params[name];
    }).join("&");

  wgraph_title = "DiskIOs - Writes";
  dgraph_title = "DiskIOs - Reads";
  pgraph_title = "Pagefaults";

  $.getJSON(resourceURL, function(data) {
    //Start by declaring sets to hold our data from the database

    //Data for DiskIO Graph
    dgraph_data = [];
    d_points = [];
    b_points = [];

    //Data for Pagefaults Graph
    pgraph_data = [];
    p_points = [];

    //Data for Writes Graph
    wgraph_data = [];
    w_points = [];
    wb_points = [];

    //Declare diskio and readbytes datasets
    dseries = {'name': 'Disk IOs',
               'data': d_points
              }
    bseries = {'name': 'Disk IO Size',
               'yAxis': 1,
               'data': b_points
              }

    //Declare writes and writebytes datasets
    wseries = {'name': 'Writes',
               'data': w_points
              }
    wbseries = {'name': 'Write Size',
                'yAxis': 1,
                'data': wb_points
               }


    //Declare pagefaults dataset
    pseries = {'name': 'Page Faults',
               'data':  p_points,
              }

    //Gather and Group data from the database
    for (var datapoint in data){
      var date = data[datapoint]["date"]
      parseDate = date.split("-");
      year = parseDate[0];
      month = parseDate[1] - 1; //Javascript months index from 0 instead of 1
      day = parseDate[2];

      reads = 0;
      read_bytes = 0;
      writes = 0;
      write_bytes = 0;
      pagefaults = 0;
      for(var item in data[datapoint]["perfdata"]){
        var perfdata = data[datapoint]["perfdata"][item];

        name = perfdata["name"];
        if(perfdata["type"] == "diskIO"){
          if(typeof dname == 'undefined' || dname == null){
            if(typeof perfdata["reads"] != 'undefined'){
              reads += perfdata["reads"];
              read_bytes += perfdata["read_bytes"];
            }
          }else{
            if(name == dname){
              if(typeof perfdata["reads"] != 'undefined'){
                reads += perfdata["reads"];
                read_bytes += perfdata["read_bytes"];
              }
            }
          }
          if (typeof wname == 'undefined' || wname == null){
            if(typeof perfdata["writes"] != 'undefined'){
              writes += perfdata["writes"];
              write_bytes += perfdata["write_bytes"];
            }
          }else{
            if(name == wname){
              if(typeof perfdata["writes"] != 'undefined'){
                writes += perfdata["writes"];
                write_bytes += perfdata["write_bytes"];
              }
            }
          }
        }else if(perfdata["type"] == "pagefaults"){
          if (typeof pname == 'undefined' || pname == null){
            pagefaults += perfdata["count"];
          }else{
            if(name == pname){
              pagefaults += perfdata["count"];
            }
          }
        }
      }

      //Declare data points using the data
      b_point = [Date.UTC(year, month, day), read_bytes, name];
      b_points.push(b_point);

      d_point = [Date.UTC(year, month, day), reads, name];
      d_points.push(d_point);

      wb_point = [Date.UTC(year, month, day), write_bytes, name];
      wb_points.push(wb_point);
      w_point = [Date.UTC(year, month, day), writes, name];
      w_points.push(w_point);

      p_point = [Date.UTC(year, month, day), pagefaults, name];
      p_points.push(p_point);
    }

    //Push the series into their respective graphs
    wgraph_data.push(wseries);
    wgraph_data.push(wbseries); //Byte size data

    dgraph_data.push(dseries);
    dgraph_data.push(bseries); //Byte size data

    pgraph_data.push(pseries);

    //Loading is complete!
    hide_loading();


    //Begin Line Chart 1
    var chart;
    jQuery(document).ready(function() {
      chart = new Highcharts.Chart({
        chart: {
          renderTo: 'container',
          type: 'spline'
        },
        title: {
          text: 'Testperf - '+dgraph_title
        },
        subtitle: {
          text: ''
        },
        xAxis: {
          type: 'datetime',
          dateTimeLabelFormats: { // don't display the dummy year
            month: '%b %e',
            year: '%Y'
          }
        },
        yAxis: [
          {
            title: {
              text: 'Number'
            },
            min: 0
          },
          {
            title:{
              text: 'Bytes'
            },
            opposite: true
          }
        ],
        tooltip: {
          formatter: function() {
            var unit = {
              'Disk IOs': 'Disk IOs (reads)',
              'Disk IO Size': 'bytes',
            }[this.series.name];

            return ''+
              //this.x +': '+ this.y +' '+ unit;
              this.y +' '+ unit;
          }
          //formatter: function() {
          //        return '<b>'+ this.series.name +'</b><br/>'+
          //        Highcharts.dateFormat('%b %e, %Y', this.x) +': '+ this.y +' times';
          //}
        },
        series: dgraph_data
      });
    });
    //End Line Chart
    //Begin Line Chart 2
    var chart2;
    jQuery(document).ready(function() {
      chart2 = new Highcharts.Chart({
        chart: {
          renderTo: 'container2',
          type: 'spline'
        },
        title: {
          text: 'Testperf - '+wgraph_title
        },
        subtitle: {
          text: ''
        },
        xAxis: {
          type: 'datetime',
          dateTimeLabelFormats: { // don't display the dummy year
            month: '%b %e',
            year: '%Y'
          }
        },
        yAxis: [
          {
            title: {
              text: 'Number Writes'
            },
            min: 0
          },
          {
            title:{
              text: 'Bytes'
            },
            opposite: true
          }
        ],
        tooltip: {
          formatter: function() {
            var unit = {
              'Writes': 'Disk IOs (writes)',
              'Write Size': 'bytes',
            }[this.series.name];

            return ''+
              //this.x +': '+ this.y +' '+ unit;
              this.y +' '+ unit;
          }
          //formatter: function() {
          //        return '<b>'+ this.series.name +'</b><br/>'+
          //        Highcharts.dateFormat('%b %e, %Y', this.x) +': '+ this.y +' times';
          //}
        },
        series: wgraph_data
      });
    });
    //End Line Chart

    //Begin Line Chart 3
    var chart3;
    jQuery(document).ready(function() {
      chart3 = new Highcharts.Chart({
        chart: {
          renderTo: 'container3',
          type: 'spline'
        },
        title: {
          text: 'Testperf - '+pgraph_title
        },
        subtitle: {
          text: ''
        },
        xAxis: {
          type: 'datetime',
          dateTimeLabelFormats: { // don't display the dummy year
            month: '%b %e',
            year: '%Y'
          }
        },
        yAxis: {
          title: {
            text: 'Number'
          },
          min: 0
        },
        tooltip: {
          formatter: function() {
            return '<b>'+ this.series.name +'</b><br/>'+
              Highcharts.dateFormat('%b %e, %Y', this.x) +': '+ this.y +' times';
          }
        },
        series: pgraph_data
      });
    });
    //End Line Chart



    $("#container").prepend('<form id="d_nameselector">DiskIO From: <select name="name" id="d_name"><option>none selected</option></select><input type="submit" name="submit" value="Change data"/></form>');
    //$("#container2").prepend('<form id="w_nameselector"><select name="name" id="w_name"><option>none selected</option></select><input type="submit" name="submit" value="Change data"/></form>');
    $("#container3").prepend('<form id="p_nameselector">Process Name: <select name="name" id="p_name"><option>none selected</option></select><input type="submit" name="submit" value="Change data"/></form>');


    //HACK USES GLOBAL VARIABLEs.
    //TODO: Convert to passing with a cookie or something better.
    for(var x in DISKIO_NAMES){
      x = DISKIO_NAMES[x];

      //Here check if dname is set
      if(x == dname){
        $('#d_name').append('<option selected>'+x+'</option>');
      }else{
        $('#d_name').append('<option>'+x+'</option>');
      }
    }
    for(var x in PAGEFAULT_NAMES){
      x = PAGEFAULT_NAMES[x];
      if(x == pname){
        $('#p_name').append('<option selected>'+x+'</option>');
      }else{
        $('#p_name').append('<option>'+x+'</option>');
      }
    }
    //for(var x in WRITE_NAMES){
    //    x = WRITE_NAMES[x];
    //    if(x == wname){
    //        $('#w_name').append('<option selected>'+x+'</option>');
    //    }else{
    //        $('#w_name').append('<option>'+x+'</option>');
    //    }
    //}

    //Change graph data! When we detect someone is asking for a specific name, do something specific.
    $("#d_nameselector").submit(function(event){
      event.preventDefault(); //Don't actually submit anywhere
      var values = {};
      $.each($('#data-selector').serializeArray(), function(i, field) {
        values[field.name] = field.value;
        //alert(field.name+": "+field.value);
      });

      var dvalues = {};
      $.each($('#d_nameselector').serializeArray(), function(i, field) {
        dvalues[field.name] = field.value;
      });
      search_name = dvalues["name"];

      if(search_name != "none selected"){
        //Do something to modify the data
        show_charts(values, search_name, pname, search_name);
      }

    });
    //Change graph data! When we detect someone is asking for a specific name, do something specific.
    $("#p_nameselector").submit(function(event){
      event.preventDefault(); //Don't actually submit anywhere
      var values = {};
      $.each($('#data-selector').serializeArray(), function(i, field) {
        values[field.name] = field.value;
        //alert(field.name+": "+field.value);
      });

      var pvalues = {};
      $.each($('#p_nameselector').serializeArray(), function(i, field) {
        pvalues[field.name] = field.value;
      });
      search_name = pvalues["name"];

      if(search_name != "none selected"){
        //Do something to modify the data
        show_charts(values, dname, search_name, dname);
      }
    });
    ////Change graph data! When we detect someone is asking for a specific name, do something specific.
    //$("#w_nameselector").submit(function(event){
    //    event.preventDefault(); //Don't actually submit anywhere
    //    var values = {};
    //    $.each($('#data-selector').serializeArray(), function(i, field) {
    //        values[field.name] = field.value;
    //        //alert(field.name+": "+field.value);
    //    });

    //    var wvalues = {};
    //    $.each($('#w_nameselector').serializeArray(), function(i, field) {
    //        wvalues[field.name] = field.value;
    //    });
    //    search_name = wvalues["name"];

    //    if(search_name != "none selected"){
    //        //Do something to modify the data
    //        show_charts(values, dname, pname, search_name);
    //    }
    //});
  }); //End $.getJSON
}

function populate_fields(){
  //Populate left selection menu
  fields = {}
  fields["tree"] = {}
  fields["test"] = {}
  fields["testgroup"] = {}
  fields["buildtype"] = {}
  fields["os"] = {}
  fields["platform"] = {}
  fields["perfdata"] = {}
  fields["perfdata"]["diskIO"] = {}
  fields["perfdata"]["writes"] = {}
  fields["perfdata"]["pagefaults"] = {}

  $.getJSON("api/perfdata/", function(data) {
    //Once we get all the json, we should traverse it
    for(var x in data){
      datapoint = data[x];
      //Initialize fieldnames to store the possibilities
      //alert(datapoint["tree"]);
      fields["tree"][datapoint["tree"]] = 1;
      fields["test"][datapoint["test"]] = 1;
      fields["testgroup"][datapoint["testgroup"]] = 1;
      fields["buildtype"][datapoint["buildtype"]] = 1;
      fields["os"][datapoint["os"]] = 1;
      fields["platform"][datapoint["platform"]] = 1;

      for (y in datapoint["perfdata"]){
        metric = datapoint["perfdata"][y]

        if (metric["type"] == "diskIO"){
          //Save the metric's name into fields["perfdata"]["diskIO"]
          fields["perfdata"]["diskIO"][metric["name"]] = 1;
        }
        if (metric["type"] == "pagefaults"){
          //Save the metric's name into fields["perfdata"]["pagefaults"]
          fields["perfdata"]["pagefaults"][metric["name"]] = 1;
        }
      } //End loop over perfdata on a datapoint
    } //End looping over all data


    //Now we write into the form all the different option types
    for(var x in fields["tree"]){
      $('#tree').append('<option>'+x+'</option>');
    }
    for(var x in fields["test"]){
      $('#test').append('<option>'+x+'</option>');
    }
    for(var x in fields["testgroup"]){
      $('#testgroup').append('<option>'+x+'</option>');
    }
    for(var x in fields["buildtype"]){
      $('#buildtype').append('<option>'+x+'</option>');
    }
    for(var x in fields["os"]){
      $('#os').append('<option>'+x+'</option>');
    }
    for(var x in fields["platform"]){
      $('#platform').append('<option>'+x+'</option>');
    }

    //Options for diskio names
    DISKIO_NAMES = [];
    PAGEFAULT_NAMES = [];
    WRITE_NAMES = [];
    for (var x in fields["perfdata"]["diskIO"]){
      //x is the name of each type
      DISKIO_NAMES.push(x);
    }
    //Options for pagefault names
    for (var x in fields["perfdata"]["pagefaults"]){
      //$('#pfname').append('<option>'+x+'</option>');
      //x is the name of each type
      PAGEFAULT_NAMES.push(x);
    }
    //for (var x in fields["perfdata"]["diskIO"]){
    //    //$('#pfname').append('<option>'+x+'</option>');
    //    //x is the name of each type
    //    WRITE_NAMES.push(x);
    //}


  }); //End .getJSON()
}

function parseDate(datestr) {
  var parsed = datestr.split("-");
  var year = parsed[0];
  var month = parsed[1] - 1; //Javascript months index from 0 instead of 1
  var day = parsed[2];

  return Date.UTC(year, month, day);
}

function showXbrowserStartupCharts(params, dname, pname, wname) {

  show_loading(); //Show loading div to keep user happy

  //Build Resource URL
  var resourceURL = '/api/xbrowserstartup/?' + 
    Object.keys(params).filter(function(name) {
      return (params[name] !== "all");
    }).map(function(name) {
      return name + "=" + params[name];
    }).join("&");
  
  
  var test = params.test + "-" + params.style;
  var graphTitle = "";
  var jsontestname = "";

  switch (test) {
    case "local-onload-warm":
      graphtitle = "Local S1 (Blank) Warm";
      break;
    case "local-twitter-warm":
      graphtitle = "Local S2 (Twitter) Warm";
      break;
    case "remote-onload-warm":
      graphtitle = "Remote S1 (Blank) Warm";
      break;
    case "remote-twitter-warm":
      graphtitle = "Remote S2 (Twitter) Warm";
      break;
    default:
      alert("Unrecognized graph name, honestly you should never see this");
      return;
  }
  
  var data = $.getJSON(resourceURL, function(data) {

      var chart;
      jQuery(document).ready(function() {
        chart = new Highcharts.Chart({
          chart: {
            renderTo: 'container',
            type: 'spline'
          },
          title: {
            text: graphtitle
          },
          subtitle: {
            text: ''
          },
          xAxis: {
            type: 'datetime',
            dateTimeLabelFormats: {
              day: '%b-%e'
           }
         },
         yAxis: {
           title: {
             text: 'Milliseconds'
           },
           min: 0
         },
         series: data.series
        });
      });
  });
}

$(function() {
  var router = Router({
    '/': {
      on: function() {
        $('#floatleft').html('<div>&nbsp;</div>');
        $('#floatright').html(ich.index_rightpanel());
        $('#nav li').removeClass('active');
      }
    },
    '/diskio': {
      on: function() {
        $('#floatleft').html(ich.diskio_leftpanel());
        $('#floatright').html(ich.diskio_rightpanel());
        $('#nav li').removeClass('active');
        $('#nav_diskio').addClass('active');

        populate_fields();

        //Get request from form and draw relevant graphs
        $("#data-selector").submit(function(event){
          event.preventDefault(); //Don't actually submit anywhere
          var values = {};
          $.each($('#data-selector').serializeArray(), function(i, field) {
            values[field.name] = field.value;
            //alert(field.name+": "+field.value);
          });
          show_charts(values);          
        });
      }
    },
    '/mochitest': {
      on: function() {
        $('#floatleft').html(ich.mochitest_leftpanel());
        $('#floatright').html(ich.mochitest_rightpanel());        
        $('#nav li').removeClass('active');
        $('#nav_mochitest').addClass('active');
      }
    },
    '/xbrowserstartup': {
      on: function() {
        $('#floatleft').html(ich.xbrowserstartup_leftpanel());
        $('#floatright').html(ich.xbrowserstartup_rightpanel());
        $('#nav li').removeClass('active');
        $('#nav_xbrowserstartup').addClass('active');

        // Get form request and draw graph
        $('#data-selector').submit(function(event){
          event.preventDefault();
          var values = {};
          $.each($('#data-selector').serializeArray(), function(i, field) {
            values[field.name] = field.value;
          });
          
          showXbrowserStartupCharts(values);
        });
      }
    }
  }).init('/');
});

  
