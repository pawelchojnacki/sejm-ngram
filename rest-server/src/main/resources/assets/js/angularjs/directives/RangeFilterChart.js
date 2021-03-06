﻿/// <reference path="../app.js" />
/// <reference path="../controllers/ChartCtrl.js" />
/// <reference path="~/js/vendor/d3.min.js" />
'use strict';

module.directive('stRangeFilterChart', function() {
    return {
        restrict: 'E',
        scope: {
            termsOccurences: '=ngModel',
            selectedRange: '=',
            linesColors: '='
        },
        link: function link(scope, iElement, iAttrs, controller, transcludeFn) {
            var svg;
            var svgWidth;
            var svgHeight;
            var chartWidth;
            var chartHeight;
            var linesCanvasWidth;
            var linesCanvasHeight;
            var defs;
            var clipPath;
            var clipPathRegion;
            var chart;
            var linesCanvas;
            var axisX;
            var axisY;
            var brush;
            var scaleX;
            var scaleY;
            var axisXFunction;
            var axisYFunction;
            var brushFunction;

            scope.isInitialized = false;

            scope.$watch('termsOccurences.length', onDataChange);

            function onDataChange() {
                var isTermsOccurencesEmpty = typeof scope.termsOccurences === 'undefined' || scope.termsOccurences === null || scope.termsOccurences.length === 0;
                if (!isTermsOccurencesEmpty && !scope.isInitialized) {
                    initialize();
                    update();
                }
                if (scope.isInitialized) {
                    update();
                }

                function initialize() {
                    var chartMargin = {
                        top: 10,
                        bottom: 10,
                        left: 10,
                        right: 10
                    };
                    var linesCanvasMargin = {
                        top: 40,
                        bottom: 40,
                        left: 40,
                        right: 40
                    };
                    svg = d3.select('#range-filter-chart');
                    svgWidth = svg.node().offsetWidth;
                    svgHeight = svg.node().offsetHeight;
                    chartWidth = svgWidth - chartMargin.left - chartMargin.right;
                    chartHeight = svgHeight - chartMargin.top - chartMargin.bottom;
                    linesCanvasWidth = chartWidth - linesCanvasMargin.left - linesCanvasMargin.right;
                    linesCanvasHeight = chartHeight - linesCanvasMargin.top - linesCanvasMargin.bottom;

                    defs = svg.append('defs');
                    clipPath = defs.append('clipPath')
                        .attr('id', 'rangeFilterLinesCanvasRegion');
                    clipPathRegion = clipPath.append('rect');
                    clipPathRegion.attr({
                        width: linesCanvasWidth,
                        height: linesCanvasHeight
                    });

                    chart = svg.append('g')
                        .attr({
                            'class': 'chart',
                            'width': chartWidth,
                            'height': chartHeight,
                            'transform': 'translate(' + chartMargin.left + ', ' + chartMargin.top + ')'
                        });

                    linesCanvas = chart.append('g')
                        .attr({
                            'class': 'linesCanvas',
                            'width': linesCanvasWidth,
                            'height': linesCanvasHeight,
                            'transform': 'translate(' + linesCanvasMargin.left + ', ' + linesCanvasMargin.top + ')'
                        });
                    axisX = chart.append('g')
                        .attr({
                            'class': 'axis axisX',
                            'transform': 'translate(' + linesCanvasMargin.left + ', ' + (linesCanvasHeight + linesCanvasMargin.top) + ')'
                        });
                    axisY = chart.append('g')
                        .attr({
                            'class': 'axis axisY',
                            'transform': 'translate(' + linesCanvasMargin.left + ', ' + linesCanvasMargin.top + ')'
                        });
                    brush = linesCanvas.append('g')
                        .attr({
                            'class': 'brush'
                        });


                    scaleX = d3.time.scale()
                        .range([0, linesCanvasWidth]);
                    scaleY = d3.scale.linear()
                        .range([linesCanvasHeight, 0]);

                    brushFunction = d3.svg.brush()
                        .x(scaleX);

                    brush.call(brushFunction)
                        .selectAll("rect")
                        .attr("height", linesCanvasHeight);

                    brushFunction.on('brush', function () {
                        scope.$apply(function () {
                            scope.selectedRange = brushFunction.extent();
                        });
                    });

                    scope.isInitialized = true;
                }
            }

            function update() {
                var minY = 0;
                var maxY = 0;

                for (var i = 0; i < scope.termsOccurences.length; i++) {
                    var tempMaxY = d3.max(scope.termsOccurences[i].occurences, function(o) { return o.count; });
                    if (tempMaxY > maxY)
                        maxY = tempMaxY;
                }

                var xRange = [scope.termsOccurences[0].occurences[0].date, scope.termsOccurences[0].occurences[scope.termsOccurences[0].occurences.length - 1].date];
                var yRange = [minY, maxY];

                scaleX.domain(xRange);
                scaleY.domain(yRange);


                for (var i = 0; i < scope.termsOccurences.length; i++) {
                    var lineId = generateLineId(scope.termsOccurences[i].name);

                    var lineFunction = d3.svg.line()
                        .x(function(o, i) { return scaleX(o.date); })
                        .y(function(o, i) { return scaleY(o.count); });
                    var flatLineFunction = d3.svg.line()
                        .x(function(o, i) { return scaleX(o.date); })
                        .y(function(o, i) { return linesCanvasHeight; });

                    var line = d3.select('#' + lineId);
                    var isLineExist = line.empty();
                    if (isLineExist) {
                        line = linesCanvas.insert('path', '.brush')
                            .attr('id', lineId)
                            .attr('class', 'line')
                            .attr('clip-path', 'url(#rangeFilterLinesCanvasRegion)')
                            .attr('style', 'stroke: ' + scope.linesColors[i])
                            .attr('d', flatLineFunction(scope.termsOccurences[i].occurences))
                            .transition()
                            .duration(1000)
                            .attr('d', lineFunction(scope.termsOccurences[i].occurences));
                    } else {
                        line.transition()
                            .duration(1000)
                            .attr('d', lineFunction(scope.termsOccurences[i].occurences));
                    }
                }

                removeObsolateLines(linesCanvas, scope.termsOccurences);

                axisXFunction = d3.svg.axis()
                    .scale(scaleX)
                    .orient('bottom')
                    .ticks(4);
                axisYFunction = d3.svg.axis()
                    .scale(scaleY)
                    .orient('left')
                    .ticks(2);

                axisX.transition().duration(1000).call(axisXFunction);
                axisY.transition().duration(1000).call(axisYFunction);
            }

            function generateLineId(term) {
                var termFormatted = term.replace(/\s/g, '_');
                var uniqueLineId = 'rangeFilterLine-' + termFormatted;

                return uniqueLineId;
            }

            function removeObsolateLines(linesCanvas, termsOccurences) {
                var lines = linesCanvas.selectAll('.line');

                lines.each(function () {
                    var line = this;
                    var lineId = line.id;
                    var isTermExist = _.any(termsOccurences, function (o, i) {
                        var term = o.name;
                        var termId = generateLineId(term);

                        return termId === lineId;
                    });

                    if (!isTermExist) {
                        line.remove();
                    }
                });
            }
        },
        template:
            '<svg width="100%" height="150">' +
                '</svg>',
        replace: true
    };
});

