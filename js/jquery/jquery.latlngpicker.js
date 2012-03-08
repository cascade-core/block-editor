/*
 * LatLngPicker
 * Copyright (c) 2011, Josef Kufner <jk@frozen-doe.net>
 * This code is distributed under MIT Licence.
 *
 */

(function($) {
	$.fn.extend({

		//This is where you write your plugin's name
		latLngPicker: function() {
			var active_loc = null;
			var map = null;
			var pin = null;
			var map_holder = null;

			return this.each(function (i, el) {
				var holder = $(el);

				var loc = holder.find('input.location');
				var lat = holder.find('input.latitude');
				var lng = holder.find('input.longtitude');

				var showMap = function () {
					if (active_loc == loc) {
						return;
					}
					hideMap();
					active_loc = loc;

					map_holder = $('<div class="ui-latLngPicker ui-widget ui-widget-content ui-corner-all"></div>').css({
						width: holder.width(),
						height: holder.width() * 3/4,
						position: 'absolute',
						background: '#fff',
						padding: '5px',
						border: '1px solid #aaa',
						margin: '3px 0px',
						overflow: 'hidden',
						'z-index': 10000
					});
					holder.after(map_holder);
					map_holder.show();

					if (typeof google == 'undefined' || typeof google.maps == 'undefined') {
						map_holder.append($('<p align="center">Sorry, Google Maps API is not loaded.</p>'));
						map = null;
					} else {
						var help = $('<div><b style="display: block; padding: 2px 5px; margin: 5px; '
									+'background: rgba(0, 0, 0, 0.4); color: white;">'
								+'Double click on map to select a location.</b></div>');

						var updatePin = function () {
							if (lat.val() != '' && lng.val() != '') {
								help.hide();
								pin.setVisible(true);
							} else {
								help.show();
								pin.setVisible(false);
							}
							pin.setPosition(new google.maps.LatLng(lat.val(), lng.val()));
						};
						lat.change(updatePin);
						lng.change(updatePin);

						var inner_holder = $('<div></div>').css({
							position: 'relative',
							width: '100%',
							height: '100%'
						});
						map_holder.append(inner_holder);

						var center = null;
						if (lat.val() != '' && lng.val() != '') {
							center = new google.maps.LatLng(lat.val(), lng.val());
						} else {
							center = new google.maps.LatLng(50.079782572051556, 14.429734647274017);
						}
						map = new google.maps.Map(inner_holder.get(0), {
							zoom: 14,
							center: center,
							mapTypeId: google.maps.MapTypeId.ROADMAP,
							disableDoubleClickZoom: true,
							streetViewControl: false
						});
						pin = new google.maps.Marker({
							position: new google.maps.LatLng(lat.val(), lng.val()),
							map: map,
							title: "Drag me!",
							draggable: true
						});
						updatePin();
						map.controls[google.maps.ControlPosition.TOP_LEFT].push(help.get(0));

						google.maps.event.addListener(map, 'dblclick', function(ev) {
							lat.val(ev.latLng.lat());
							lng.val(ev.latLng.lng());
							updatePin();
						});
						google.maps.event.addListener(pin, 'dragend', function(ev) {
							lat.val(pin.position.lat());
							lng.val(pin.position.lng());
							updatePin();
						});

					}

					holder.mousedown(function(ev) {
						ev.stopPropagation();
					});
					map_holder.mousedown(function(ev) {
						ev.stopPropagation();
					});
				};

				var hideMap = function() {
					if (map_holder) {
						map_holder.remove();
						delete pin;
						delete map;
						active_loc = null;
						map_holder = null;
						map = null;
					}
					return true;
				}

				loc.focus(showMap);

				$(document).mousedown(hideMap);
				$(document).keydown(function (ev) {
					switch (ev.keyCode) {
						case 9:
						case 27:
						case 13:
							hideMap();
					}
					return true;
				});

				return this;
			});
		}
	});

})(jQuery);

