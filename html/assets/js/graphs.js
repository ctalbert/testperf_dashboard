/*
* graphs.js
*
* @author   Sam Liu <sam@ambushnetworks.com>
* @desc     Internal
* @depends  Jquery
* @notes    Results output to div id "result", graphs
*           draw to "container," all other messages
*           go to "error."
*
*/

function show_loading(){
    //Clear the display divs and show loading gif
    $('#content-main').html("<div id='loading' style='margin:0 auto; padding-top:20px;'><center><span style='font-weight:200; font-size:200%;'>Loading...</span><br/><img height='32' width='32' src='./assets/images/loading.gif' alt='' /></center></div>");
    $('#errors').html("");
    $('#container').html("");
}

function hide_loading(){
    //Hide loading div after page loads
    $('#loading').html("")
}

function sortPairs(a,b){
    //Sort function for array -- used in determining top mochitests
    if(a[0] > b[0]){
        return -1;
    }
    return 1;
}
function rmDupPairs(arr) {
    //Remove duplicates from sorted tuple array (specific to show_mochitests)
    var i;
    len=arr.length;
    out=[];
    obj={};

    //Mark hash table
    for (i=0;i<len;i++) {
        obj[arr[i][1]]=0;
    }

    //Skip over things that are marked duplicate in the hash table
    for (i in arr) {
        if (obj[arr[i][1]] == 0){
            obj[arr[i][1]] = 1;
            out.push(arr[i]);
        }
    }
    return out;
}

function ISODateString(d){
    //Get ISO Date from UTC Date
    function pad(n){return n<10 ? '0'+n : n}
    return d.getUTCFullYear()+'-'+pad(d.getUTCMonth()+1)+'-'+pad(d.getUTCDate());
}
function basename(path) {
    //Gets basename of a path
    return path.replace(/\\/g,'/').replace( /.*\//, '' );
}

function divide(dividend, divisor){
    //Division function that allows division by zero (returns zero)
    quotient = dividend/divisor;
    if(isFinite(quotient)){
        return quotient;
    }
    return 0;
}

function to_hours(value){
    //Convert a time from seconds to hours to two decimal places
    return Math.round(value * 100 / 60 / 60) / 100;
}

//Each function below represents a graph to be displayed

function show_charts(params, dname, pname){
    //Testperf Charts (DiskIOs and Pagefaults)
    show_loading(); //Show loading div to keep user happy

    new_params = []
    for (var x in params){
        if (params[x] != "any"){
            new_params.push([params[x],x]);
        }
    }

    //Build Resource URL
    resourceURL = 'api/perfdata/';
    var count = 0;
    for (x in new_params){
        if(count == 0){
            resourceURL += "?";
            count++;
        }else{
            resourceURL += "&";
        }

        resourceURL += new_params[x][1] + "=" + new_params[x][0]
    }

    dgraph_title = "DiskIOs";
    pgraph_title = "Pagefaults";

    $.getJSON(resourceURL, function(data) {
        dgraph_data = [];
        pgraph_data = [];

        d_points = []
        b_points = []
        p_points = []
        dseries = {'name': 'Disk IOs (reads)',
                    'data': d_points
                  }
        bseries = {'name': 'Disk IO Size (read bytes)',
                    'data': b_points
                  }
        pseries = {'name': 'Page Faults',
                   'data':  p_points
                  }

        //Group data
        for (var datapoint in data){
            var date = data[datapoint]["date"]
            parseDate = date.split("-");
            year = parseDate[0];
            month = parseDate[1] - 1; //Javascript months index from 0 instead of 1
            day = parseDate[2];

            reads = 0;
            read_bytes = 0;
            pagefaults = 0;
            for(var item in data[datapoint]["perfdata"]){
                var perfdata = data[datapoint]["perfdata"][item];

                name = perfdata["name"];
                if(perfdata["type"] == "diskIO"){
                    if(typeof dname == 'undefined' || dname == null){
                        reads += perfdata["reads"];
                        read_bytes += perfdata["read_bytes"];
                    }else{
                        if(name == dname){
                            reads += perfdata["reads"];
                            read_bytes += perfdata["read_bytes"];
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
            b_point = [Date.UTC(year, month, day), read_bytes, name];
            d_point = [Date.UTC(year, month, day), reads, name];
            p_point = [Date.UTC(year, month, day), pagefaults, name];

            b_points.push(b_point);
            d_points.push(d_point);
            p_points.push(p_point);
        }
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
                    renderTo: 'container2',
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

        //Begin Line Chart 2
        var chart2;
        jQuery(document).ready(function() {
            chart2 = new Highcharts.Chart({
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
                series: dgraph_data
            });
        });
        //End Line Chart

        $("#container").prepend('<form id="d_nameselector"><select name="name" id="d_name"><option>none selected</option></select><input type="submit" name="submit" value="Change data"/></form>');
        $("#container2").prepend('<form id="p_nameselector"><select name="name" id="p_name"><option>none selected</option></select><input type="submit" name="submit" value="Change data"/></form>');


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
                show_charts(values, search_name, pname);
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
                show_charts(values, dname, search_name);
            }
        });
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


    }); //End .getJSON()
}
