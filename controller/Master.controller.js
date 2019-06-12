jQuery.sap.require("ZHR_TIMESHEET_UI5.utils.DataManager");
jQuery.sap.require("ZHR_TIMESHEET_UI5.utils.UIHelper");

sap.ui.define([
	"jquery.sap.global",
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"sap/ui/model/Filter",
	"sap/ui/core/routing/History"
], function (jQuery, Controller, MessageBox, Filter, History) {
	"use strict";

	return Controller.extend("ZHR_TIMESHEET_UI5.controller.Master", {
		onInit: function () {
			window.change = '0';
			window.first = "1";
			var view = this.getView();
			window.view = view;
			this._oBusyDialog = new sap.m.BusyDialog();
			this._oBusyDialog.open();
			var that = this;

			var oModel = new sap.ui.model.odata.ODataModel(
				"/sap/opu/odata/sap/ZHR_TIMESHEET_UI5_SRV/", false);

			ZHR_TIMESHEET_UI5.utils.DataManager.init(oModel, ' ');
			ZHR_TIMESHEET_UI5.utils.UIHelper.setControllerInstance(this);

			oModel.attachRequestCompleted(function (oEvent) {

				if (oEvent.getParameters().success) {
					//window.view = view;
					var data = view.getBindingContext().getObject();
					window.data = data;
					// Set Days on Calendar
					var calendar = view
						.byId("weeklyCalendar");
					var dateFormat = sap.ui.core.format.DateFormat
						.getDateTimeInstance({
							pattern: "yyyy-MM-dd"
						});
					var date = dateFormat.format(new Date(
						data.Dte));
					//var begda = dateFormat.format(new Date(
					//data.Begda));
					//var endda = dateFormat.format(new Date(
					//data.Endda));

					var begda = dateFormat.format(new Date(
						data.Spbeg));
					var endda = dateFormat.format(new Date(
						data.Spend));
					if (window.first === "1") {
						//calendar.setcd(date); *
						var s = new Date();
						var sb, se;
						var diffDays = parseInt((that.getUiDate(endda) - that.getUiDate(s)) / (1000 * 60 * 60 * 24));
						if (diffDays >= 14) {

							sb = new Date(begda);
							se = that.manipulateDate(sb, 13, "add");
						} else {

							se = new Date(endda);
							sb = that.manipulateDate(se, 13, "sub");

						}

						calendar.removeAllSelectedDates();
						//	var m = Date.parse(date);
						//	var d = new Date(m);

						var dateMx = dateFormat.format(new Date(
							data.Maxdate));
						var dateMn = dateFormat.format(new Date(
							data.Mindate));
						var mx = Date.parse(dateMx);
						var mn = Date.parse(dateMn);
						var dMx = new Date(mx);
						var dMn = new Date(mn);
						calendar.setMaxDate(dMx);
						calendar.setMinDate(dMn);

						calendar.focusDate(s);
						calendar.insertSelectedDate(new sap.ui.unified.DateTypeRange({
							startDate: s
						}));

						if (+dMn <= +sb) {
							calendar.setStartDate(sb);
						} else {
							calendar.setStartDate(dMn);
						}

						var dateFormat1 = sap.ui.core.format.DateFormat
							.getDateTimeInstance({
								pattern: "yyyy-MM-ddTHH:mm:ss"
							});

						window.legbeg = dateFormat1.format(new Date(sb));
						window.legend = dateFormat1.format(new Date(se));;

						/*	calendar.focusDate(d);
							calendar.insertSelectedDate(new sap.ui.unified.DateTypeRange({
								startDate: d
							}));
							calendar.setStartDate(d);
							window.legbeg = window.data.Begda;
							window.legend = window.data.Endda;*/

						window.first = "2";
					} else {
						/*// works for period selection as well..	
							if (data.Dte === data.Begda) {
							calendar.removeAllSelectedDates();
							var m1 = Date.parse(begda);
							var d1 = new Date(m1);
							calendar.focusDate(d1);
						calendar.insertSelectedDate(new sap.ui.unified.DateTypeRange({
							startDate: d1
							}));
							calendar.setStartDate(d1);
						}*/

						var selectedDates = window.calendar.getSelectedDates();
						var len = selectedDates.length;
						if (len > 0) {
							len = len - 1;
						}
						if (selectedDates.length >= 1) {
							var sdate = selectedDates[len].getStartDate();
						}

						var sb1;
						if (data.Dte === data.Spbeg) {
							sb1 = data.Dte;
						} else {
							var days = parseInt((that.getUiDate(data.Spend) - that.getUiDate(data.Dte)) / (1000 * 60 * 60 * 24));
							if (days >= 14) {
								sb1 = data.Spbeg;
							} else {
								var se1 = new Date(data.Spend);
								sb1 = that.manipulateDate(se1, 13, "sub");
							}
						}

						if (sb1) {
							calendar.removeAllSelectedDates();

							var spbegda = dateFormat.format(new Date(sb1));
							var m1 = Date.parse(spbegda); //Start Date
							var d1 = new Date(m1);
							calendar.setStartDate(d1);
							var m2 = Date.parse(data.Dte); // Seleceted Date
							//var m2 = Date.parse(sdate); // Seleceted Date
							var d2 = new Date(m2);
							calendar.focusDate(d2);
							calendar.insertSelectedDate(new sap.ui.unified.DateTypeRange({
								startDate: d2
							}));
						}

					}
					// Set the Legend for selected fortnight
					//  get begin and end dates for fortnight

					var path = "/WorkScheduleSet(Pernr='" + window.data.Pernr + "',Begda=datetime'" + window.legbeg + "',Endda=datetime'" +
						window.legend + "')";
					oModel
						.read(
							path,
							null,
							null,
							true,
							function (oData, oResponse) {
								// remove special dates and will be added again..
								if (window.calendar) {
									window.calendar.removeAllSpecialDates();
									window.calendar.destroySpecialDates();
									var selectedDates = window.calendar.getSelectedDates();
								}

								for (var i = 1; i < 15; i++) {
									if (i < 10) {
										i = "0" + i;
									}
									var dt;
									dt = "oData.Dte" + i;
									var oRefDate = new Date(eval(dt));
									calendar.removeSpecialDate(oRefDate);
									var tp = "oData.Tooltip" + i;
									tp = eval(tp);
									var sType = sap.ui.unified.CalendarDayType.Type05;
									var wk = "oData.Wknd" + i;
									wk = eval(wk);
									var ph = "oData.Phl" + i
									ph = eval(ph);
									var lv = "oData.Lve" + i;
									lv = eval(lv);
									var lvapp = "oData.Lveapp" + i;
									lvapp = eval(lvapp);

									var ptnwday = "oData.Ptnwday" + i;
									ptnwday = eval(ptnwday);

									var hda = "oData.Hda" + i;
									hda = eval(hda);

									var approvedhda = "oData.Approvedhda" + i;
									approvedhda = eval(approvedhda);

									var noFlex = "oData.Noflex" + i;
									noFlex = eval(noFlex);

									var mDay = "oData.Missingday" + i;
									mDay = eval(mDay);

									if (lv === "X") {
										sType = sap.ui.unified.CalendarDayType.Type03;
									}
									if (lvapp === "X") {
										sType = sap.ui.unified.CalendarDayType.Type08;
									}

									if (hda === "X" || approvedhda === "X" || noFlex === "X") {
										sType = sap.ui.unified.CalendarDayType.Type02;
									}
									if (mDay === "X") {
										sType = sap.ui.unified.CalendarDayType.Type10;
									}

									if (ptnwday === "X") {
										sType = sap.ui.unified.CalendarDayType.Type06;
									}

									if (ph === "X") {
										sType = sap.ui.unified.CalendarDayType.Type01;
									}

									var len = selectedDates.length;
									if (len > 0) {
										len = len - 1;
									}
									if (selectedDates.length >= 1) {
										var sdate = selectedDates[len].getStartDate();
										//remove legend for selected date
										//if (+sdate === +oRefDate) 
										if (sdate.setHours(0, 0, 0, 0) === oRefDate.setHours(0, 0, 0, 0)) {
											sType = sap.ui.unified.CalendarDayType.Type05;
										}
									}

									if (sType !== sap.ui.unified.CalendarDayType.Type05) {
										calendar.addSpecialDate(new sap.ui.unified.DateTypeRange({
											startDate: new Date(oRefDate),
											type: sType,
											tooltip: tp
										}));
									}
								}

							});

					view.getController().loadData(data);
					that._oBusyDialog.close();
				} else {

					var dateFormat2 = sap.ui.core.format.DateFormat
						.getDateTimeInstance({
							pattern: "yyyy-MM-dd"
						});
					var date3 = dateFormat2.format(new Date());
					var m3 = Date.parse(date3);
					var d3 = new Date(m3);
					window.calendar.setStartDate(d3);
					var object = oEvent.getParameters().errorobject;

					var message = $(object.responseText)
						.find("message").first().text();
					var code = $(object.responseText)
						.find("code").first().text();
					var oSubDialog1 = new sap.m.Dialog({
						title: "Not Found!",
						type: "Message",
						state: "Error",
						content: [new sap.m.Text({
							text: message
						})]
					});
					oSubDialog1.open();
					oSubDialog1
						.addButton(new sap.m.Button({
							text: "OK",
							press: function () {
								oSubDialog1
									.close();
								oSubDialog1.destroyContent();

								if (that._oBusyDialog) {
									that._oBusyDialog.close();
								}

								if (code === "ZHR_TS/001") { //Critical Errors...
									that.getView().byId("timesheetpage").destroyContent();
									that.getView().byId("timesheetpage").destroyFooter();
									that.onNavBack(); // back to home
								} else {
									// Set last day in case error
									var sEntityPath = "/TimesheetSet(Pernr='" + window.data.Pernr + "',Subty='" + window.data.Subty + "',Objps='" + window.data
										.Objps + "',Begda=datetime'" + window.data.Begda + "',Endda=datetime'" + window.data.Endda + "',Sprps='" + window.data
										.Sprps +
										"',Seqnr='" + window.data.Seqnr + "',Dte=datetime'" + window.data.Dte + "')";
									window.view.getController().Read(sEntityPath);
								}
							}
						}));

					if (that._oBusyDialog) {
						that._oBusyDialog.close();
					}

				}
			});

			if (that._oBusyDialog) {
				that._oBusyDialog.close();
			}

			this.getView().setModel(oModel);
			var oDate = new Date();
			var dateFormat = sap.ui.core.format.DateFormat
				.getDateTimeInstance({
					pattern: "yyyy-MM-ddTHH:mm:ss"
				});
			var date = dateFormat.format(new Date(oDate));
			// oDate = oDate.replace(/:/g, "%3A");
			var pernr = '00000000';
			var subty = '00';
			var objps = '';
			var begda = date;
			var endda = date;
			var sprps = '';
			var seqnr = '000';
			var day = date;

			var sEntityPath = "/TimesheetSet(Pernr='" + pernr + "',Subty='" + subty + "',Objps='" + objps + "',Begda=datetime'" + begda +
				"',Endda=datetime'" + endda + "',Sprps='" + sprps + "',Seqnr='" + seqnr + "',Dte=datetime'" + day + "')";
			// Bind View
			view.bindElement(sEntityPath);
			window.path = sEntityPath;

			// Get Element Instances for usage later
			// Header Fields
			window.headerTxt = this.getView().byId("idAttndHeader1");
			window.attndTxt = this.getView().byId("AttndTxt");
			//	window.balOpen = this.getView().byId("idBalOpenHead")
			//		.setEnabled(false);
			window.labelbalAdj = this.getView().byId("label2");
			window.balAdj = this.getView().byId("idBalAdj").setEnabled(true);
			this.getView()
				.byId("btnNeg").setVisible(true);
			this.getView().byId("btnPos").setVisible(true);
			//	window.balClose = this.getView().byId("idBalCloseHead")
			//		.setEnabled(false);
			window.cashO = this.getView().byId("idCashO").setEnabled(true);
			window.labelemp = this.getView().byId("label4");
			window.empcomm =
				this.getView().byId("idEmpComm");
			window.supcomm = this.getView().byId("idSupComm").setEnabled(false);
			window.sup = this.getView()
				.byId("idSuper");
			window.labelsup = this.getView().byId("label6");

			// Details Fields
			window.flx = this.getView().byId("idFlxText");
			window.pts = this.getView().byId("idPtswap");
			window.beg1 = this.getView().byId(
				"idBeg1");
			window.end1 = this.getView().byId("idEnd1");
			window.beg2 = this.getView().byId("idBeg2");
			window.end2 = this.getView()
				.byId("idEnd2");
			window.beg3 = this.getView().byId("idBeg3");
			window.end3 = this.getView().byId("idEnd3");
			window.beg4 = this.getView()
				.byId("idBeg4");
			window.end4 = this.getView().byId("idEnd4");
			window.btnadd1 = this.getView().byId("btnAdd1");
			window.btndel1 =
				this.getView().byId("btnDel1");
			window.blankln2 = this.getView().byId("idBlankln2");
			window.btnadd2 = this.getView().byId(
				"btnAdd2");
			window.btndel2 = this.getView().byId("btnDel2");
			window.blankln3 = this.getView().byId("idBlankln3");
			window.btnadd3 =
				this.getView().byId("btnAdd3");
			window.btndel3 = this.getView().byId("btnDel3");
			window.blankln4 = this.getView().byId(
				"idBlankln4");
			window.btndel4 = this.getView().byId("btnDel4");
			window.abs = this.getView().byId("idAbs");
			window.labs = this.getView()
				.byId("idAbsl");
			window.calendar = this.getView().byId("weeklyCalendar");
			window.save = this.getView().byId("idSave");
			window.submit = this.getView().byId("idSubmit");
			window.legend = this.getView().byId("idLegend");

			window.lve = this.getView().byId("idLve");
			window.std = this.getView().byId("idStd");
			window.tot = this.getView().byId("idTot");
			window.flxb = this.getView().byId("idFlxbal");
			window.oth = this.getView().byId("idOth");
			window.loth = this.getView().byId("idOthl");
			window.casho = this.getView().byId("idCashOut");

			this.multipleEventsSetToFalse();

			window.legend.addItem(new sap.ui.unified.CalendarLegendItem({
				text: "Public Holiday",
				type: sap.ui.unified.CalendarDayType.Type01
			}));
			window.legend.addItem(new sap.ui.unified.CalendarLegendItem({
				text: "Part Time Non Working Day",
				type: sap.ui.unified.CalendarDayType.Type06
			}));
			window.legend.addItem(new sap.ui.unified.CalendarLegendItem({
				text: "UnApproved Leave",
				type: sap.ui.unified.CalendarDayType.Type03
			}));

			window.legend.addItem(new sap.ui.unified.CalendarLegendItem({
				text: "Approved Leave",
				type: sap.ui.unified.CalendarDayType.Type08
			}));

			window.legend.addItem(new sap.ui.unified.CalendarLegendItem({
				text: "No Flex Accrual",
				type: sap.ui.unified.CalendarDayType.Type02
			}));

			window.legend.addItem(new sap.ui.unified.CalendarLegendItem({
				text: "Action Required",
				type: sap.ui.unified.CalendarDayType.Type10
			}));

			//window.baltitle = this.getView().byId("idBalTitle");
			window.header2 = this.getView().byId("idHeader2");

		},

		manipulateDate: function (date, days, operation) {
			var dateOffset = (24 * 60 * 60 * 1000) * days;
			var myDate = new Date();
			if (operation === "sub") {
				myDate.setTime(date.getTime() - dateOffset);
			} else if (operation === "add") {
				myDate.setTime(date.getTime() + dateOffset);
			}
			return myDate;
		},

		// Handle add delete buttons on breaks
		// If Middle slot is deleted move/shift value up so as to
		// create consistency
		// in breaks
		handleAddbreak1: function () {

			if (this.checkInputTimes(1) === true || this.checkInputTimes(1) === "") {
				var beg = window.beg1.getValue();
				var end = window.end1.getValue();
				if (beg && end) {
					window.beg2.setValue("");
					window.end2.setValue("");
					window.beg2.setValueState(sap.ui.core.ValueState.None);
					window.end2.setValueState(sap.ui.core.ValueState.None);
					window.view.getController().showTimes2();
					window.btnadd1.setVisible(false);
					window.btnadd2.setEnabled(true);
					window.flag1 = 1;
				} else {
					var oSubDialog1 = new sap.m.Dialog({
						title: "Not Allowed!",
						type: "Message",
						state: "Error",
						content: [new sap.m.Text({
							text: "Please Enter Start and End Times, before adding another Row!"
						})]
					});
					oSubDialog1.open();
					oSubDialog1.addButton(new sap.m.Button({
						text: "OK",
						press: function () {
							oSubDialog1.close();
						}
					}));
				}
			}
		},
		handleDelbreak1: function () {
			var beg = window.beg1.getValue();
			var end = window.end1.getValue();
			if (beg !== "" || end !== "") {
				if (window.beg2.getValue()) {
					var beg2 = window.beg2.getValue();
					var end2 = window.end2.getValue();
					window.beg1.setValue(beg2);
					window.end1.setValue(end2);

					if (window.beg3.getValue()) {
						var beg3 = window.beg3.getValue();
						var end3 = window.end3.getValue();
						window.beg2.setValue(beg3);
						window.end2.setValue(end3);

						if (window.beg4.getValue()) {
							var beg4 = window.beg4
								.getValue();
							var end4 = window.end4
								.getValue();
							window.beg3.setValue(beg4);
							window.end3.setValue(end4);
							window.view.getController()
								.hideTimes4();
							window.btnadd3.setVisible(true);
							window.beg4.setValue("");
							window.end4.setValue("");
							window.beg4.setValueState(sap.ui.core.ValueState.None);
							window.end4.setValueState(sap.ui.core.ValueState.None);
							window.flag4 = 0;
						} else {
							window.view.getController()
								.hideTimes3();
							window.view.getController()
								.hideTimes4();
							window.btnadd2.setVisible(true);
							window.beg3.setValue("");
							window.end3.setValue("");
							window.beg3.setValueState(sap.ui.core.ValueState.None);
							window.end3.setValueState(sap.ui.core.ValueState.None);
							window.flag3 = 0;
						}
					} else {
						window.view.getController().hideTimes2();
						window.view.getController().hideTimes3();
						window.btnadd1.setVisible(true);
						window.beg2.setValue("");
						window.end2.setValue("");
						window.beg2.setValueState(sap.ui.core.ValueState.None);
						window.end2.setValueState(sap.ui.core.ValueState.None);
						window.flag2 = 0;
					}
				} else {
					window.beg1.setValue("");
					window.end1.setValue("");
					window.beg1.setValueState(sap.ui.core.ValueState.None);
					window.end1.setValueState(sap.ui.core.ValueState.None);
					window.view.getController().hideTimes2();
					window.btnadd1.setVisible(true);
					//window.btnadd1.setVisible(false);
				}
			}
			// Auto Save
			this.handleAutoSave(1);
		},
		handleAddbreak2: function () {

			if (this.checkInputTimes(2) === true || this.checkInputTimes(2) === "") {
				var beg = window.beg2.getValue();
				var end = window.end2.getValue();
				if (beg && end) {
					window.beg3.setValue("");
					window.end3.setValue("");
					window.beg3.setValueState(sap.ui.core.ValueState.None);
					window.end3.setValueState(sap.ui.core.ValueState.None);
					window.view.getController().showTimes3();
					window.btnadd2.setVisible(false);
					window.btnadd3.setEnabled(true);
					window.flag2 = 1;
				} else {
					var oSubDialog1 = new sap.m.Dialog({
						title: "Not Allowed!",
						type: "Message",
						state: "Error",
						content: [new sap.m.Text({
							text: "Please Enter Start and End Times, before adding another Row!"
						})]
					});
					oSubDialog1.open();
					oSubDialog1.addButton(new sap.m.Button({
						text: "OK",
						press: function () {
							oSubDialog1.close();
						}
					}));
				}
			}
		},
		handleDelbreak2: function () {
			if (window.beg3.getValue()) {
				var beg = window.beg3.getValue();
				var end = window.end3.getValue();
				window.beg2.setValue(beg);
				window.end2.setValue(end);

				if (window.beg4.getValue()) {
					var beg4 = window.beg4.getValue();
					var end4 = window.end4.getValue();
					window.beg3.setValue(beg4);
					window.end3.setValue(end4);
					window.view.getController().hideTimes4();
					window.btnadd3.setVisible(true);
					window.beg4.setValue("");
					window.end4.setValue("");
					window.beg4.setValueState(sap.ui.core.ValueState.None);
					window.end4.setValueState(sap.ui.core.ValueState.None);
					window.flag4 = 0;
				} else {
					window.view.getController().hideTimes3();
					window.view.getController().hideTimes4();
					window.btnadd2.setVisible(true);
					window.beg3.setValue("");
					window.end3.setValue("");
					window.beg3.setValueState(sap.ui.core.ValueState.None);
					window.end3.setValueState(sap.ui.core.ValueState.None);
					window.flag3 = 0;
				}
			} else {
				window.view.getController().hideTimes2();
				window.view.getController().hideTimes3();
				window.btnadd1.setVisible(true);
				window.beg2.setValue("");
				window.end2.setValue("");
				window.beg2.setValueState(sap.ui.core.ValueState.None);
				window.end2.setValueState(sap.ui.core.ValueState.None);
				window.flag2 = 0;
			}
			// Auto Save
			this.handleAutoSave(1);

		},
		handleAddbreak3: function () {
			if (this.checkInputTimes(3) === true || this.checkInputTimes(3) === "") {
				var beg = window.beg3.getValue();
				var end = window.end3.getValue();
				if (beg && end) {
					window.beg4.setValue("");
					window.end4.setValue("");
					window.view.getController().showTimes4();
					window.btnadd3.setVisible(false);
					window.flag3 = 1;

				} else {
					var oSubDialog1 = new sap.m.Dialog({
						title: "Not Allowed!",
						type: "Message",
						state: "Error",
						content: [new sap.m.Text({
							text: "Please Enter Start and End Times, before adding another Row!"
						})]
					});
					oSubDialog1.open();
					oSubDialog1.addButton(new sap.m.Button({
						text: "OK",
						press: function () {
							oSubDialog1.close();
						}
					}));
				}
			}
		},
		handleDelbreak3: function () {

			if (window.beg4.getValue()) {
				var beg = window.beg4.getValue();
				var end = window.end4.getValue();
				window.beg3.setValue(beg);
				window.end3.setValue(end);

				window.view.getController().hideTimes4();
				window.btnadd3.setVisible(true);
				window.beg4.setValue("");
				window.end4.setValue("");
				window.beg4.setValueState(sap.ui.core.ValueState.None);
				window.end4.setValueState(sap.ui.core.ValueState.None);
				window.flag4 = 0;
			} else {
				window.view.getController().hideTimes3();
				window.view.getController().hideTimes4();
				window.btnadd2.setVisible(true);
				window.beg3.setValue("");
				window.end3.setValue("");
				window.beg3.setValueState(sap.ui.core.ValueState.None);
				window.end3.setValueState(sap.ui.core.ValueState.None);
				window.flag3 = 0;
			}
			// Auto Save
			this.handleAutoSave(1);

		},
		handleDelbreak4: function () {
			window.view.getController().hideTimes4();
			window.btnadd3.setVisible(true);
			window.beg4.setValue("");
			window.end4.setValue("");
			window.beg4.setValueState(sap.ui.core.ValueState.None);
			window.end4.setValueState(sap.ui.core.ValueState.None);
			window.flag4 = 0;
			// Auto Save
			this.handleAutoSave(1);
		},
		disableTimes1: function () {
			window.beg1.setEnabled(false);
			window.end1.setEnabled(false);
			window.btndel1.setEnabled(false);
			window.btnadd1.setEnabled(false);
		},
		disableTimes2: function () {
			window.beg2.setEnabled(false);
			window.end2.setEnabled(false);
			window.btndel2.setEnabled(false);
			window.btnadd2.setEnabled(false);
		},
		disableTimes3: function () {
			window.beg3.setEnabled(false);
			window.end3.setEnabled(false);
			window.btndel3.setEnabled(false);
			window.btnadd3.setEnabled(false);
		},
		disableTimes4: function () {
			window.beg4.setEnabled(false);
			window.end4.setEnabled(false);
			window.btndel4.setEnabled(false);
		},

		enableTimes1: function () {
			window.beg1.setEnabled(true);
			window.end1.setEnabled(true);
			window.btndel1.setEnabled(true);
			window.btnadd1.setEnabled(true);

		},
		enableTimes2: function () {
			window.beg2.setEnabled(true);
			window.end2.setEnabled(true);
			window.btndel2.setEnabled(true);
			window.btnadd2.setEnabled(true);

		},
		enableTimes3: function () {
			window.beg3.setEnabled(true);
			window.end3.setEnabled(true);
			window.btndel3.setEnabled(true);
			window.btnadd3.setEnabled(true);

		},
		enableTimes4: function () {
			window.beg4.setEnabled(true);
			window.end4.setEnabled(true);
			window.btndel4.setEnabled(true);
		},
		showTimes1: function () {
			window.beg1.setVisible(true);
			window.end1.setVisible(true);
			window.btndel1.setVisible(true);
			window.btnadd1.setVisible(true);
		},
		showTimes2: function () {
			window.beg2.setVisible(true);
			window.end2.setVisible(true);
			window.btndel2.setVisible(true);
			window.btnadd2.setVisible(true);
			window.blankln2.setVisible(true);
		},
		showTimes3: function () {
			window.beg3.setVisible(true);
			window.end3.setVisible(true);
			window.btndel3.setVisible(true);
			window.btnadd3.setVisible(true);
			window.blankln3.setVisible(true);
		},
		showTimes4: function () {
			window.beg4.setVisible(true);
			window.end4.setVisible(true);
			window.btndel4.setVisible(true);
			window.blankln4.setVisible(true);
		},
		showAbsHours: function () {
			window.abs.setVisible(true);
			window.labs.setVisible(true);
		},

		hideTimes1: function () {
			window.beg1.setVisible(false);
			window.end1.setVisible(false);
			window.btndel1.setVisible(false);
			window.btnadd1.setVisible(false);
		},
		hideTimes2: function () {
			window.beg2.setVisible(false);
			window.end2.setVisible(false);
			window.btndel2.setVisible(false);
			window.btnadd2.setVisible(false);
			//window.blankln2.setVisible(false);
		},
		hideTimes3: function () {
			window.beg3.setVisible(false);
			window.end3.setVisible(false);
			window.btndel3.setVisible(false);
			window.btnadd3.setVisible(false);
			window.blankln3.setVisible(false);
		},
		hideTimes4: function () {
			window.beg4.setVisible(false);
			window.end4.setVisible(false);
			window.btndel4.setVisible(false);
			window.blankln4.setVisible(false);
		},
		hideAbsHours: function () {
			window.abs.setVisible(false);
			window.labs.setVisible(false);
		},

		loadData: function (data) {
			// Initialize time fields based on Values retrieved
			// Hide show fields based on values retrieved
			// Initialize fields based on Times check
			// Read only - TimeSheet Approved and for Future Dates
			if (data.TimesReadonly === "X") {
				window.flx.setEnabled(false);
				window.pts.setEnabled(false);
				window.abs.setEnabled(false);
				window.balAdj.setEnabled(false);
				this.getView().byId("btnNeg").setEnabled(false);
				this.getView().byId("btnPos").setEnabled(false);
				window.cashO.setEnabled(false);
				window.sup.setEnabled(false);
				window.empcomm.setEnabled(false);
				window.view.getController().disableTimes1();
				window.view.getController().disableTimes2();
				window.view.getController().disableTimes3();
				window.view.getController().disableTimes4();

			} else if (data.FutureFlxPts === "X") {

				if ((data.PtsRead === "X" && data.Std !== "0.00" && data.Lve === "0.00") || (data.Pts === "X")) {
					window.pts.setEnabled(true);
					window.pts.setVisible(true);
				} else {
					window.pts.setEnabled(false);
					window.pts.setVisible(false);
				}

				if ((data.FxaRead === "X" && data.Std !== "0.00" && data.Lve === "0.00") || (data.Fxa === "X")) {
					window.flx.setEnabled(true);
					window.flx.setVisible(true);
				} else {
					window.flx.setEnabled(false);
					window.flx.setVisible(false);
				}

				window.abs.setEnabled(false);
				window.balAdj.setEnabled(false);
				this.getView().byId("btnNeg").setEnabled(false);
				this.getView().byId("btnPos").setEnabled(false);
				window.cashO.setEnabled(false);
				window.sup.setEnabled(false);
				window.empcomm.setEnabled(false);
				window.view.getController().disableTimes1();
				window.view.getController().disableTimes2();
				window.view.getController().disableTimes3();
				window.view.getController().disableTimes4();

			} else {

				window.flx.setEnabled(true);
				window.pts.setEnabled(true);
				window.abs.setEnabled(true);
				window.balAdj.setEnabled(true);
				this.getView().byId("btnNeg").setEnabled(true);
				this.getView().byId("btnPos").setEnabled(true);
				window.cashO.setEnabled(true);
				window.empcomm.setEnabled(true);
				window.sup.setEnabled(true);
				window.view.getController().enableTimes1();
				window.view.getController().enableTimes2();
				window.view.getController().enableTimes3();
				window.view.getController().enableTimes4();

				if ((data.PtsRead === "X" && data.Std !== "0.00" && data.Lve === "0.00") || (data.Pts === "X")) {
					window.pts.setEnabled(true);
					window.pts.setVisible(true);
				} else {
					window.pts.setEnabled(false);
					window.pts.setVisible(false);
				}

				if (data.AbsRead === "X") { //&& data.Std !== "0.00"
					window.abs.setEnabled(true);
					window.abs.setVisible(true);
				} else {
					window.abs.setEnabled(false);
					window.abs.setVisible(false);
				}

				if ((data.FxaRead === "X" && data.Std !== "0.00" && data.Lve === "0.00") || (data.Fxa === "X")) {
					window.flx.setEnabled(true);
					window.flx.setVisible(true);
				} else {
					window.flx.setEnabled(false);
					window.flx.setVisible(false);
				}

				if (data.Noinput === "X") { //Not Active of this day
					window.view.getController().disableTimes1();
					window.view.getController().disableTimes2();
					window.view.getController().disableTimes3();
					window.view.getController().disableTimes4();

				}

			}

			// hide full form if both are not required..	
			if (data.Flxen === "" && data.Fcoen === "") {
				window.labelbalAdj.setVisible(false);
				window.balAdj.setVisible(false);
				this.getView().byId("btnNeg").setVisible(false);
				this.getView().byId("btnPos").setVisible(false);
				window.labelemp.setVisible(false);
				window.empcomm.setVisible(false);
				window.sup.setVisible(false);
				window.supcomm.setVisible(false);
				window.labelsup.setVisible(false);
				this.getView().byId("idCashO").setVisible(false);
				this.getView().byId("label3a").setVisible(false);
				this.getView().byId("idCashOut").setVisible(false);
			} else {
				window.balAdj.setVisible(true);
				window.labelbalAdj.setVisible(true);
				this.getView().byId("btnNeg").setVisible(true);
				this.getView().byId("btnPos").setVisible(true);
				window.labelemp.setVisible(true);
				window.empcomm.setVisible(true);
				window.sup.setVisible(true);
				window.supcomm.setVisible(true);
				window.labelsup.setVisible(true);
				this.getView().byId("idCashO").setVisible(true);
				this.getView().byId("label3a").setVisible(true);
				this.getView().byId("idCashOut").setVisible(true);
			}
			// NoCashout or Hide cashout --Invisible..
			if (data.FlxcoHide === "X" || data.Fcoen === "") {
				this.getView().byId("idCashO").setVisible(false);
				this.getView().byId("label3a").setVisible(false);
				this.getView().byId("idCashOut").setVisible(false);
			}
			// NoFlex --Invisible..
			if (data.Flxen === "") {
				window.labelbalAdj.setVisible(false);
				window.balAdj.setVisible(false);
				this.getView().byId("btnNeg").setVisible(false);
				this.getView().byId("btnPos").setVisible(false);
				window.empcomm.setVisible(false);
				window.sup.setVisible(false);
				window.supcomm.setVisible(false);
				window.labelsup.setVisible(false);
			} else {
				window.labelbalAdj.setVisible(true);
				window.balAdj.setVisible(true);
				this.getView().byId("btnNeg").setVisible(true);
				this.getView().byId("btnPos").setVisible(true);
				window.empcomm.setVisible(true);
				window.sup.setVisible(true);
				window.supcomm.setVisible(true);
				window.labelsup.setVisible(true);

			}

			if (data.Resn2 === "") {
				window.supcomm.setVisible(false);
				window.labelsup.setVisible(false);
			} else {
				window.supcomm.setVisible(true);
				window.labelsup.setVisible(true);
			}

			var v = "Opening Balance Hours: " + this.decimalToTimeString(data.Flxop) + "\xa0\xa0\xa0\xa0\xa0\xa0\xa0" +
				" Closing Balance Hours: " + this.decimalToTimeString(
					data.Flxbl);

			window.header2.setTitle(v);
			window.sup.setValue(data.Apname);
			window.cashO.setSelectedKey(data.Flxci);
			window.flx.setSelected(data.Fxa);
			window.pts.setSelected(data.Pts);

			if (window.btnAdd1 === false && window.btnAdd2 === false && window.btnAdd3 === false) {

				if (data.Bga === "000000" || data.Eda === "000000") {
					window.beg1.setValue("");
					window.end1.setValue("");
					//window.btnadd1.setVisible(false);
					window.btnadd1.setVisible(true);
					window.flag1 = 0;
				} else {
					window.flag1 = 1;
					window.btnadd1.setVisible(true);
				}

				if (data.Bgb === "000000" || data.Bgb === "") {
					window.beg2.setValue("");
					window.end2.setValue("");
					window.view.getController().hideTimes2();
					//window.btnadd1.setVisible(true);
					window.flag2 = 0;
				} else {
					window.view.getController().showTimes2();
					window.btnadd1.setVisible(false);
					window.flag2 = 1;
				}

				if (data.Bgc === "000000" || data.Bgc === "") {
					window.beg3.setValue("");
					window.end3.setValue("");
					window.view.getController().hideTimes3();
					window.flag3 = 0;
					if (data.Bgb !== "000000") {
						window.btnadd2.setVisible(true);
					} else {
						window.btnadd2.setVisible(false);
					}
				} else {
					window.view.getController().showTimes3();
					window.btnadd2.setVisible(false);
					window.flag3 = 1;
				}

				if (data.Bgd === '000000' || data.Bgd === "") {
					window.beg4.setValue("");
					window.end4.setValue("");
					window.view.getController().hideTimes4();
					window.flag4 = 0;
					window.view.getController().hideAbsHours();
					if (data.Bgc !== "000000" && data.Bgc !== "") {
						window.btnadd3.setVisible(true);
					} else {
						window.btnadd3.setVisible(false);
					}

				} else {
					window.view.getController().showTimes4();
					window.btnadd3.setVisible(false);
					window.flag4 = 1;
					window.view.getController().showAbsHours();
				}
			} else {
				window.view.getController().hideAbsHours();
				if (data.Bga === "000000" || data.Bga === "") {
					window.beg1.setValue("");
					window.end1.setValue("");
				}
				if (data.Bgb === "000000" || data.Bgb === "") {
					window.beg2.setValue("");
					window.end2.setValue("");
				}
				if (data.Bgc === "000000" || data.Bgc === "") {
					window.beg3.setValue("");
					window.end3.setValue("");

				}
				if (data.Bgd === "000000" || data.Bgd === "") {
					window.beg4.setValue("");
					window.end4.setValue("");
				}
			}

			this.multipleEventsSetToFalse();

			//Abs hours
			if (data.Abs !== "0.00") {
				window.view.getController().showAbsHours();
			}

			//TIL or OT hours
			if (data.Oth !== "0.00") {
				window.oth.setVisible(true);
				window.loth.setVisible(true);
			} else {
				window.oth.setVisible(false);
				window.loth.setVisible(false);
			}

			// Footer Buttons
			if (data.SubmitVis === "X") {
				window.submit.setEnabled(true);
			} else {
				window.submit.setEnabled(false);
			}

			if (data.SaveVis === "X") {
				window.save.setEnabled(true);
			} else {
				window.save.setEnabled(false);
			}

			// Set Header Text
			window.headerTxt.setTitle(data.HeaderText);
			// Set Attendence text based on days selected
			var calendarRef = window.view.byId('weeklyCalendar');
			var selectedDates = calendarRef.getSelectedDates();
			var len = selectedDates.length;
			if (len > 1) {
				len = len - 1;
				var t = data.Attendtext + " and " + "" + len + " more day(s) selected.";
				window.attndTxt.setText(t);
			}
			// Convert Decimal to Time Format..
			window.abs.setValue((this.decimalToTimeString(data.Abs)));
			window.lve.setText((this.decimalToTimeString(data.Lve)));
			window.std.setText((this.decimalToTimeString(data.Std)));
			window.tot.setText((this.decimalToTimeString(data.Ttl)));
			window.flxb.setText((this.decimalToTimeString(data.Fbl)));
			window.oth.setText((this.decimalToTimeString(data.Oth)));

			if (data.Flxad !== "" && data.Flxad !== "0.00" && data.Flxad !== "-0.00") {
				window.balAdj.setValue(this.convertBalAdjUiFormat(this.decimalToTimeString(data.Flxad)));
			} else {
				window.balAdj.setValue("");
				this.getView().byId("btnPos").setType();
				this.getView().byId("btnPos").setPressed(false);
				this.getView().byId("btnNeg").setType();
				this.getView().byId("btnNeg").setPressed(false);
			}
			window.casho.setText((this.decimalToTimeString(data.Flxco)));

		},

		handleMultipleEvents: function () {
			// if they are two events -- out of foucs and Add Row event then after auto save
			// fire the corresponding Add row event...

			if (this.getView().byId("btnAdd1")._bActive === true) {
				window.btnAdd1 = true;
			} else {
				window.btnAdd1 = false;
			}
			if (this.getView().byId("btnAdd2")._bActive === true) {
				window.btnAdd2 = true;
			} else {
				window.btnAdd2 = false;
			}

			if (this.getView().byId("btnAdd3")._bActive === true) {
				window.btnAdd3 = true;
			} else {
				window.btnAdd3 = false;
			}

			if (this.getView().byId("btnDel1")._bActive === true) {
				window.btnDel1 = true;
			} else {
				window.btnDel1 = false;
			}
			if (this.getView().byId("btnDel2")._bActive === true) {
				window.btnDel2 = true;
			} else {
				window.btnDel2 = false;
			}

			if (this.getView().byId("btnDel3")._bActive === true) {
				window.btnDel3 = true;
			} else {
				window.btnDel3 = false;
			}
			if (this.getView().byId("btnDel3")._bActive === true) {
				window.btnDel4 = true;
			} else {
				window.btnDel4 = false;
			}

			if (this.getView().byId("idSubmit")._bActive === true) {
				window.btnSubmit = true;
			} else {
				window.btnSubmit = false;
			}

			if (this.getView().byId("idPdf")._bActive === true) {
				window.btnOverview = true;
			} else {
				window.btnOverview = false;
			}

			if (this.getView().byId("idPeriod")._bActive === true) {
				window.btnPeriod = true;
			} else {
				window.btnPeriod = false;
			}

		},

		multipleEventsSetToFalse: function () {
			window.btnAdd1 = false;
			window.btnAdd2 = false;
			window.btnAdd3 = false;
			window.btnDel1 = false;
			window.btnDel2 = false;
			window.btnDel3 = false;
			window.btnDel4 = false;
			window.btnSubmit = false;
			window.btnOverview = false;
			window.btnPeriod = false;

		},

		handleChange: function (oEvent) {
			// Time Fields validation and Auto Save if there are correct		
			var btn = "btnAdd";
			var id = oEvent.getSource().getId();
			var idNum = id.slice(-1);
			var idNameStart = "idBeg" + idNum;
			var idNameEnd = "idEnd" + idNum;
			var startTime = this.getView().byId(idNameStart).getValue();
			var endTime = this.getView().byId(idNameEnd).getValue();

			if (!((startTime === "" && endTime) || (startTime && endTime === ""))) {
				var t = this.checkInputTimes(idNum);
				if (t === true) {
					// handle multiple events if available.
					this.handleMultipleEvents();
					// Auto Save
					this.handleAutoSave();
				}
			}
		},

		checkInputTimes: function (n) {
			var idNameStart = "idBeg" + n;
			var idNameEnd = "idEnd" + n;
			var startTime = this.getView().byId(idNameStart).getValue();
			var endTime = this.getView().byId(idNameEnd).getValue();
			var s1 = "-";
			var b;

			// check Time Format..
			if (startTime.indexOf(s1) !== -1 || endTime.indexOf(s1) !== -1) {
				sap.m.MessageToast.show("Invalid input time format");
				b = false;
			} else {
				// Get difference in Seconds
				if ((startTime) && (endTime)) {
					var diff = (this.timeStringToSeconds(endTime) - this.timeStringToSeconds(startTime));

					if (diff < 0) {
						sap.m.MessageToast.show("Start Time cannot be less than End Time");
						b = false;
					} else {
						var bO = this.checkOverlapTimes();
						var bC = this.isTimesInOrder();
						var bL = this.checkOverlapTimesWithLeave();
						var bOt = this.checkOverlapTimesWithOverTime();
						if (!bO && !bC && !bL && !bOt) {
							b = true;
						} else {
							if (bO === true) {
								sap.m.MessageToast.show("Times Overlapped");
							}
							if (bC === true) {
								sap.m.MessageToast.show("Times are not in Sequential Order");
							}
							if (bC === true && bO === true) {
								sap.m.MessageToast.show("Times are not in Sequential Order and Overlapped");
							}
							if (bL === true) {
								sap.m.MessageToast.show("Times are in collision with Leave");
							}
							if (bOt === true) {
								sap.m.MessageToast.show("Times are in collision with Overtime");
							}
							b = false;
						}
					}
				} else if (((startTime === "") && (endTime)) || ((startTime) && (endTime === ""))) {
					sap.m.MessageToast.show("Enter Time value");
					b = false;
				} else {
					this.getView().byId(idNameStart).setValueState(sap.ui.core.ValueState.None);
					this.getView().byId(idNameEnd).setValueState(sap.ui.core.ValueState.None);
					b = "";
				}
			}

			if (b === false) {
				this.getView().byId(idNameStart).setValueState(sap.ui.core.ValueState.Error);
				this.getView().byId(idNameEnd).setValueState(sap.ui.core.ValueState.Error);

			} else if (b === true) {
				this.getView().byId(idNameStart).setValueState(sap.ui.core.ValueState.Success);
				this.getView().byId(idNameEnd).setValueState(sap.ui.core.ValueState.Success);
			}
			return b;

		},

		// Convert HHmmss to Seconds
		timeStringToSeconds: function (s) {
			var result = [];
			for (var j = 0; j < s.length; j += 2) {
				result.push(s.substring(j, j + 2));
			}
			var seconds = (+result[0]) * 60 * 60 + (+result[1]) * 60 + (+result[2]);
			return seconds;
		},

		// Convert HHmmss to Minutes
		timeStringToMinutes: function (s) {
			var result = [];
			for (var j = 0; j < s.length; j += 2) {
				result.push(s.substring(j, j + 2));
			}
			var minutes = (+result[0]) * 60 + (+result[1]);
			return minutes;
		},

		// Time String to Array for checking overlap
		timeStringToArray: function () {
			var timesArray = [];
			for (var i = 1; i <= 4; i++) {
				var idNameStart = "idBeg" + i;
				var idNameEnd = "idEnd" + i;
				var startTime = this.getView().byId(idNameStart).getValue();
				var endTime = this.getView().byId(idNameEnd).getValue();
				if ((startTime) && (endTime)) {
					var newLine = {
						startTime: startTime,
						endTime: endTime
					};
					timesArray.push(newLine);
				}
			}
			return timesArray;

		},

		timeStringToDecimal: function (s) {
			var s1, sign;
			if (s.length && s[0] === "-") {
				s1 = s.replace(/^\-/, "");
				sign = "-";
			} else {
				sign = "";
				s1 = s;
			}
			s1 = s1.replace(/ /g, "");
			var hoursMinutes = s1.split(/[.:]/);
			if (hoursMinutes[0] === "--" || hoursMinutes[0] === "") {
				hoursMinutes[0] = "00";
			}
			if (hoursMinutes[1] === "--" || hoursMinutes[1] === "") {
				hoursMinutes[1] = "00";
			}
			var hours = parseInt(hoursMinutes[0], 10);
			var minutes = hoursMinutes[1] ? parseInt(hoursMinutes[1], 10) : 0;
			return sign + (hours + minutes / 60).toFixed(4);
		},

		decimalToTimeString: function (s) {
			var sign = s < 0 ? "-" : "";
			var hours = Math.floor(Math.abs(s));
			var mins = Math.floor(Math.round((Math.abs(s) * 60) % 60));
			return sign + (hours < 10 ? "0" : "") + hours + ":" + (mins < 10 ? "0" : "") + mins;
		},

		checkOverlapping: function (a, b) {
			var start1 = this.timeStringToMinutes(a.startTime);
			var end1 = this.timeStringToMinutes(a.endTime);
			var start2 = this.timeStringToMinutes(b.startTime);
			var end2 = this.timeStringToMinutes(b.endTime);
			return (end1 > start2 && end2 > start1);
		},

		checkOverlapTimes: function () {
			var timesArray = this.timeStringToArray();
			var i, j;
			for (i = 0; i < timesArray.length - 1; i++) {
				for (j = i + 1; j < timesArray.length; j++) {
					if (this.checkOverlapping(timesArray[i], timesArray[j])) {
						return true;
					}
				}
			}
			return false;

		},

		checkTimeOrder: function (a, b) {
			var s1 = this.timeStringToMinutes(a.startTime);
			var e1 = this.timeStringToMinutes(a.endTime);
			var s2 = this.timeStringToMinutes(b.startTime);
			var e2 = this.timeStringToMinutes(b.endTime);
			return (s1 > s2 && e1 > e2);
		},

		isTimesInOrder: function () {
			var timesArray = this.timeStringToArray();
			var i, j;
			for (i = 0; i < timesArray.length - 1; i++) {
				for (j = i + 1; j < timesArray.length; j++) {
					if (this.checkTimeOrder(timesArray[i], timesArray[j])) {
						return true;
					}
				}
			}
			return false;
		},
		changeStatusToNone: function () {
			for (var i = 1; i <= 4; i++) {
				var idNameStart = "idBeg" + i;
				var idNameEnd = "idEnd" + i;
				this.getView().byId(idNameStart).setValueState(sap.ui.core.ValueState.None);
				this.getView().byId(idNameEnd).setValueState(sap.ui.core.ValueState.None);
			}
			this.getView().byId("idEmpComm").setValueState(sap.ui.core.ValueState.None);
			this.getView().byId("idBalAdj").setValueState(sap.ui.core.ValueState.None);
			this.getView().byId("idAbs").setValueState(sap.ui.core.ValueState.None);
		},

		lveStringToArray: function (s) {
			//convert leave string into array for comparision..
			var lveTimes = [];
			var lveArray = [];
			lveTimes = s.replace(/[', ]/g, "").split("|");
			for (var i = 0; i < lveTimes.length; i++) {
				var t = lveTimes[i].replace(/[', ]/g, "").split("-");
				var st = t[0];
				var et = t[1];
				if ((st) && (et)) {
					var nl = {
						startTime: st,
						endTime: et
					};
					lveArray.push(nl);
				}
			}
			return lveArray;
		},

		checkOverlapTimesWithLeave: function () {
			var l = this.lveStringToArray(data.Lvetimes);
			var t = this.timeStringToArray();
			var i, j;
			for (i = 0; i < l.length; i++) {
				for (j = 0; j < t.length; j++) {
					if (this.checkOverlapping(l[i], t[j])) {
						return true;
					}
				}
			}
			return false;
		},

		otStringToArray: function (s) {
			//convert overtime string into array for comparision..
			var otTimes = [];
			var otArray = [];
			otTimes = s.replace(/[', ]/g, "").split("|");
			for (var i = 0; i < otTimes.length; i++) {
				var t = otTimes[i].replace(/[', ]/g, "").split("-");
				var st = t[0];
				var et = t[1];
				if ((st) && (et)) {
					var nl = {
						startTime: st,
						endTime: et
					};
					otArray.push(nl);
				}
			}
			return otArray;
		},

		checkOverlapTimesWithOverTime: function () {
			var l = this.otStringToArray(data.Ottimes);
			var t = this.timeStringToArray();
			var i, j;
			for (i = 0; i < l.length; i++) {
				for (j = 0; j < t.length; j++) {
					if (this.checkOverlapping(l[i], t[j])) {
						return true;
					}
				}
			}
			return false;
		},

		onNavBack: function () {
			var oHistory = History.getInstance();
			var sPreviousHash = oHistory.getPreviousHash();

			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
				oCrossAppNavigator.toExternal({
					target: {
						semanticObject: ""
					}
				});
			}
		},

		handleBalAdjHours: function () {
			var b = this.checkBalAdjHours();
			if (b === true || b === "") {
				// handle multiple events if available.
				this.handleMultipleEvents();
				this.handleAutoSave();
			}
		},

		checkBalAdjHours: function () {
			// check emp comments is filled in..
			var a = window.balAdj.getValue();
			var f = "_";
			var b = "";
			// check Input Format..
			if (a.indexOf(f) !== -1) {
				sap.m.MessageToast.show("Invalid Format - Use  HH:mm Format");
				b = false;
			}
			if (b !== false) {
				var ec = this.getView().byId("idEmpComm").getValue();
				if (a === "" || a === "000000" || a === "00:00") {
					b = "";
				} else if (ec !== "" && (a !== "" || a !== "000000" || a !== "00:00")) {
					b = true;
				} else {
					sap.m.MessageToast.show("Fill in Employee Comments");
					b = false;
				}
				if (b === false) {
					this.getView().byId("idEmpComm").setValueState(sap.ui.core.ValueState.Error);
				} else {
					this.getView().byId("idEmpComm").setValueState(sap.ui.core.ValueState.None);
				}
			}
			return b;
		},

		onPressTb: function (evt) {
			var s = evt.getSource().getId();
			var ec = this.getView().byId("idEmpComm").getValue();
			var b = this.checkBalAdjHours();
			if (b !== "") {
				if (s.indexOf("btnNeg") !== -1) {
					this.getView().byId("btnNeg").setPressed(true);
					this.getView().byId("btnNeg").setType("Reject");
					this.getView().byId("btnPos").setPressed(false);
					this.getView().byId("btnPos").setType();
				}
				if (s.indexOf("btnPos") !== -1) {
					this.getView().byId("btnNeg").setPressed(false);
					this.getView().byId("btnNeg").setType();
					this.getView().byId("btnPos").setPressed(true);
					this.getView().byId("btnPos").setType("Accept");
				}
			} else {
				var p = this.getView().byId("btnPos").getPressed();
				var n = this.getView().byId("btnNeg").getPressed();
				if (p === true) {
					this.getView().byId("btnPos").setType("Accept");
					this.getView().byId("btnNeg").setType();
					this.getView().byId("btnNeg").setPressed(false);
				} else {
					this.getView().byId("btnPos").setType();
				}
				if (n === true) {
					this.getView().byId("btnNeg").setType("Reject");
					this.getView().byId("btnPos").setType();
					this.getView().byId("btnPos").setPressed(false);
				} else {
					this.getView().byId("btnNeg").setType();
				}
			}
			if ((b === true) && ec) {
				this.handleAutoSave();
			}
		},
		convertBalAdjInternalFormat: function (s) {
			var s1 = this.getView().byId("btnNeg").getPressed();
			if (s1 === true) {
				var s2 = "-" + s;
				return s2;
			} else {
				return s;
			}
		},
		convertBalAdjUiFormat: function (s) {

			var s2 = s.replace(/^\-/, "");
			if (s[0] === "-") {
				this.getView().byId("btnNeg").setPressed(true);
				this.getView().byId("btnNeg").setType("Reject");
				this.getView().byId("btnPos").setPressed(false);
				this.getView().byId("btnPos").setType();
			} else {
				this.getView().byId("btnNeg").setPressed(false);
				this.getView().byId("btnNeg").setType();
				this.getView().byId("btnPos").setPressed(true);
				this.getView().byId("btnPos").setType("Accept");

			}
			s2 = s2.replace(/ /g, "");
			return s2;
		},

		handleEmpComments: function (evt) {
			var a = window.balAdj.getValue();
			var v = evt.getParameter("newValue");
			if (a && v === "") {
				sap.m.MessageToast.show("Fill in Employee Comments");
				this.getView().byId("idEmpComm").setValueState(sap.ui.core.ValueState.Error);
			} else {
				this.getView().byId("idEmpComm").setValueState(sap.ui.core.ValueState.None);
				// handle multiple events if available.
				this.handleMultipleEvents();
				this.handleAutoSave();
			}
		},
		handleInputAbsHours: function (evt) {
			var s = evt.getParameter("newValue");
			var s2 = s.replace(/-/g, "0");
			window.abs.setValue(s2);
			this.getView().byId("idAbs").setValueState(sap.ui.core.ValueState.Success);
			// handle multiple events if available.
			this.handleMultipleEvents();
			// Auto Save on submission of Absence Hours Input field value
			this.handleAutoSave();
		},

		handleFlxSelect: function () {
			// Auto Save on selection of All Day Flex check box
			this.handleAutoSave();
		},

		handlePtDaySwap: function () {
			// Auto Save on selection of Part TimeDay Swap check box
			this.handleAutoSave();
		},

		handleCashOutSelection: function () {
			// Auto Save on selection of Cash out 
			this.handleAutoSave();
		},

		checkBeforeSubmitNew: function () {
			// Check Before final submit whether all days are filled in or not.
			var md = "";
			var fd = "";
			var mdt = "";
			var j;
			var td;
			if (data.TermDate) {
				td = data.TermDate;
			}
			var d = data;
			for (var i = 1; i <= 28; i++) {
				if (i <= 9) {
					j = "0" + i;
				} else {
					j = i;
				}
				var dte = "Dte" + j;
				var bga = "Bga" + j;
				var eda = "Eda" + j;
				var pts = "Pts" + j;
				var fxa = "Fxa" + j;
				var abs = "Abs" + j;
				var lve = "Lve" + j;
				var std = "Std" + j;
				var fxaread = "FxaRead" + j; //flex indicator
				// if current day is filled in then assign these from window.oentry
				if ((window.oEntry.Dte === d[dte]) && window.btnSubmit === true) {
					d[bga] = window.oEntry.Bga;
					d[eda] = window.oEntry.Eda;
					d[abs] = window.oEntry.Abs;
					d[pts] = window.oEntry.Pts;
					d[fxa] = window.oEntry.Fxa;
				}
				if ((d[bga] === "000000" || d[bga] === "") &&
					(d[eda] === "000000" || d[eda] === "") &&
					(d[abs] === "0.00" || d[abs] === "") &&
					(d[lve] === "0.00" || d[lve] === "") &&
					(d[pts] !== "X") &&
					(d[fxa] !== "X") &&
					(d[std] !== "0.00") && (d[fxaread] === "X")
				) {
					var sd = this.getUiDate(d[dte]);
					//termination date filled in check till termination date
					if (td) {
						var tDate = this.getUiDate(td);
						if (sd.setHours(0, 0, 0, 0) <= tDate.setHours(0, 0, 0, 0)) {
							mdt = true;
						}
					} else {
						var m = new Date();
						var cd = this.getUiDate(m);
						if (cd.setHours(0, 0, 0, 0) >= sd.setHours(0, 0, 0, 0)) {
							md = true;
						} else {
							fd = true;
						}
					}
				}
			}

			if (td) {
				if (mdt === true) {
					MessageBox.error(
						"This timesheet is incomplete till termination date and cannot be submitted ", {
							title: "Error"
						});
					data.TermDate = null; // clear the term date on error
					window.data.termdate = null;

					return false;
				} else {
					data.TermDate = td;
					window.data.termdate = td;
					return true;
				}
			} else {
				if ((md === true) && (data.PendingTs === "X")) {
					MessageBox.error(
						" Unable to submit timesheet: All previous timesheets must be approved and this timesheet is incomplete and cannot be submitted", {
							title: "Error"
						});
					return false;
				}
				if (data.PendingTs === "X") {
					MessageBox.error(
						"Unable to submit timesheet: All previous timesheets must be approved", {
							title: "Error"
						});
					return false;
				}
				if (md === true) {
					MessageBox.error(
						"This timesheet is incomplete and cannot be submitted", {
							title: "Error"
						});
					return false;
				}
				if (fd === true) {
					this.dialogOpen();
					return false;
				}
				if (md === "" && data.PendingTs === "" && fd === "") {
					return true;
				}
			}
		},

		getUiDate: function (date) {
			var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "dd/MM/yyyy"
			});
			var date1 = new Date(date);
			var dateStr = dateFormat.format(date1);
			var parts = dateStr.split("/");
			return new Date(parts[2], parts[1] - 1, parts[0]);
		},

		fireMutlipleEvent: function () {
			if (window.btnAdd1 === true) {
				this.getView().byId("btnAdd1").firePress();
			}
			if (window.btnAdd2 === true) {
				this.getView().byId("btnAdd2").firePress();
			}
			if (window.btnAdd3 === true) {
				this.getView().byId("btnAdd3").firePress();
			}
			/*	if (window.btnDel1 === true) {
					this.getView().byId("btnDel1").firePress();
				}
				if (window.btnDel2 === true) {
					this.getView().byId("btnDel2").firePress();
				}
				if (window.btnDel3 === true) {
					this.getView().byId("btnDel3").firePress();
				}
				if (window.btnDel4 === true) {
					this.getView().byId("btnDel4").firePress();
				}*/
			if (window.btnSubmit === true) {
				this.getView().byId("idSubmit").firePress();
			}
			if (window.btnOverview === true) {
				this.getView().byId("idPdf").firePress();
			}
			if (window.btnPeriod === true) {
				this.getView().byId("idPeriod").firePress();
			}

		},

		handleAutoSave: function (d) {
			var t = "";
			if (d === 1) {
				for (var j = 4; j >= 1; j--) {
					t = this.checkInputTimes(j);
					if (t === false) {
						break;
					}
				}
			}

			if (t === true || t === "") {
				var calendarRef = window.view.byId('weeklyCalendar');
				var selectedDates = calendarRef.getSelectedDates();
				window.view.getController().getdata();

				var oModel = new sap.ui.model.odata.ODataModel(
					"/sap/opu/odata/sap/ZHR_TIMESHEET_UI5_SRV/",
					false);

				oModel.setUseBatch(true);
				// oModel.setDeferredGroups(["batchUpdateGroup"]);
				var Id = "batchUpdateGroup";
				var batchChanges = [];
				//oModel.sDefaultUpdateMethod = "PUT";
				var mParameters = {
					"groupId": Id,
					"changeSetId": Id
				};

				if (selectedDates.length !== 0) {
					for (var i = 0; i < selectedDates.length; i++) {
						var date_sel = selectedDates[i].getStartDate();
						var dateFormat = sap.ui.core.format.DateFormat
							.getDateTimeInstance({
								pattern: "yyyy-MM-ddTHH:mm:ss"
							});
						date_sel = dateFormat.format(new Date(date_sel));
						window.oEntry.Dte = date_sel;

						var beg = window.data.Begda.replace(/:/g, "%3A");
						var end = window.data.Endda.replace(/:/g, "%3A");
						date_sel = date_sel.replace(/:/g, "%3A");
						var sEntityPath = "/TimesheetSet(Pernr='" + window.data.Pernr + "',Subty='" + window.data.Subty + "',Objps='" + window.data.Objps +
							"',Begda=datetime'" + beg + "',Endda=datetime'" + end + "',Sprps='" + window.data.Sprps + "',Seqnr='" + window.data.Seqnr +
							"',Dte=datetime'" + date_sel + "')";

						batchChanges.push(oModel.createBatchOperation(sEntityPath, "PUT", window.oEntry));

					}

					oModel.addBatchChangeOperations(batchChanges);

					if (this._oBusyDialog) {
						this._oBusyDialog.close();
					}

					this._oBusyDialog = new sap.m.BusyDialog();
					this._oBusyDialog.open();

					var that = this;
					oModel.submitBatch(function (data) {
						oModel.refresh();

						if (data.__batchResponses[0].__changeResponses) {
							// sap.m.MessageToast.show("Updated " + data.__batchResponses[0].__changeResponses.length + " Record(s)");
							oModel.refresh();
							//window.view.getModel().refresh(true);
							that.getView().getElementBinding().refresh(true);
							var message1 = $(data.__batchResponses[0].__changeResponses[0].headers["sap-message"])
								.find('message').first()
								.text();
							if (message1) {
								that.multipleEventsSetToFalse();
								var oSubDialog2 = new sap.m.Dialog({
									title: "Auto Saved with Warning",
									type: "Message",
									state: "Warning",
									content: [new sap.m.Text({
										text: message1
									})]
								});
								oSubDialog2.open();
								oSubDialog2
									.addButton(new sap.m.Button({
										text: "OK",
										press: function () {
											oSubDialog2
												.close();
											if (that._oBusyDialog) {
												that._oBusyDialog.close();
											}
										}
									}));
							} else {
								that.fireMutlipleEvent();
							}
							if (that._oBusyDialog) {
								that._oBusyDialog.close();
							}

						} else {

							that.multipleEventsSetToFalse();

							sap.m.MessageToast.show(data.__batchResponses[0].message);
							var message = $(data.__batchResponses[0].response.body)
								.find('message').first()
								.text();
							var oSubDialog1 = new sap.m.Dialog({
								title: "Update failed",
								type: "Message",
								state: "Error",
								content: [new sap.m.Text({
									text: message
								})]
							});
							oSubDialog1.open();
							oSubDialog1
								.addButton(new sap.m.Button({
									text: "OK",
									press: function () {
										oSubDialog1
											.close();
										if (that._oBusyDialog) {
											that._oBusyDialog.close();
										}
									}
								}));

							//window.view.getModel().refresh(true);
							if (that._oBusyDialog) {
								that._oBusyDialog.close();
							}

						}

					}, function (err) {
						that.multipleEventsSetToFalse();
						if (that._oBusyDialog) {
							that._oBusyDialog.close();
						}
					});
				}
			}

		},

		dialogOpen: function (oEvent) {

			if (!this.dialog) {
				this.dialog = sap.ui.xmlfragment("idfragment",
					"ZHR_TIMESHEET_UI5.view.TerminationDate",
					this // associate controller with the fragment
				);
				this.getView().addDependent(this.dialog);
			}
			// toggle compact style
			// When user ReOpens the Dialog.. back to original state
			var oTb1 = sap.ui.getCore().byId("idfragment--idTb1F");
			var oDp1 = sap.ui.getCore().byId("idfragment--idDp1F");
			var oLb1 = sap.ui.getCore().byId("idfragment--idLb2F");
			oTb1.setPressed(false);
			oDp1.setVisible(false);
			oDp1.setValue(null);
			oLb1.setVisible(false);
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this.dialog);
			window.termdate = sap.ui.getCore().byId("idfragment--idDp1F");
			this.dialog.open();
		},

		onPress: function (oEvent) {

			var oButton = sap.ui.getCore().byId("idfragment--idBtn1f");
			var oDp1 = sap.ui.getCore().byId("idfragment--idDp1F");
			var oLb1 = sap.ui.getCore().byId("idfragment--idLb2F");
			if (oEvent.getSource().getPressed()) {
				oButton.setEnabled(true);
				oDp1.setVisible(true);
				oLb1.setVisible(true);
				oDp1.setMinDate(new Date(data.CurrentSpbegda));
				oDp1.setMaxDate(new Date(data.CurrentSpendda));
			} else {
				oButton.setEnabled(false);
				oDp1.setVisible(false);
				oLb1.setVisible(false);
			}

		},
		handleChangeTerminationDate: function (oEvent) {
			var termDate = oEvent.getSource().getValue();
			var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "yyyy-MM-dd"
			});
			var date1 = new Date(termDate);
			data.TermDate = dateFormat.format(date1) + "T00:00:00"

		},

		onDialogCloseButton: function (oEvent) {
			window.termdate = null; //clear the value
			data.TermDate = null;
			this.dialog.close();
		},
		onDialogSaveButton: function (oEvent) {
			data.TermDate = window.termdate.getValue();
			if (data.TermDate !== " " && data.TermDate !== null) {
				this.dialog.close();
				this.handleSubmitDetails(); //submit timesheet
			}
		},

		handleDateChange: function (oEvent) {
			// window.date = oEvent.getParameters().date; *
			var selectedDates = oEvent.getSource().getSelectedDates();
			var len = selectedDates.length;
			if (len > 0) {
				len = len - 1;
			}
			if (selectedDates.length === 0) {
				oEvent.getSource().removeAllSelectedDates();
			} else {
				window.date = selectedDates[len].getStartDate();
			}
			// Check whether current record is changed and saved
			window.view.getController().getdata();
			window.view.getController().changedate(window.date);
			// Set None Status for all Time fields.
			this.changeStatusToNone();
		},

		handleSaveDetails: function () {
			var t = "";
			for (var j = 4; j >= 1; j--) {
				t = this.checkInputTimes(j);
				if (t === false) {
					break;
				}
			}
			var b = this.checkBalAdjHours();
			if ((t === true || t === "") && (b === true || b === "")) {
				var calendarRef = window.view.byId("weeklyCalendar");
				var selectedDates = calendarRef.getSelectedDates();
				window.view.getController().getdata();
				var oModel = new sap.ui.model.odata.ODataModel(
					"/sap/opu/odata/sap/ZHR_TIMESHEET_UI5_SRV/",
					false);
				oModel.setUseBatch(true);
				// oModel.setDeferredGroups(["batchUpdateGroup"]);
				var Id = "batchUpdateGroup";
				var batchChanges = [];
				//oModel.sDefaultUpdateMethod = "PUT";
				var mParameters = {
					"groupId": Id,
					"changeSetId": Id
				};
				if (selectedDates.length !== 0) {
					for (var i = 0; i < selectedDates.length; i++) {
						var date_sel = selectedDates[i].getStartDate();
						var dateFormat = sap.ui.core.format.DateFormat
							.getDateTimeInstance({
								pattern: "yyyy-MM-ddTHH:mm:ss"
							});
						date_sel = dateFormat.format(new Date(date_sel));
						window.oEntry.Dte = date_sel;

						var beg = window.data.Begda.replace(/:/g, "%3A");
						var end = window.data.Endda.replace(/:/g, "%3A");
						date_sel = date_sel.replace(/:/g, "%3A");
						var sEntityPath = "/TimesheetSet(Pernr='" + window.data.Pernr + "',Subty='" + window.data.Subty + "',Objps='" + window.data.Objps +
							"',Begda=datetime'" + beg + "',Endda=datetime'" + end + "',Sprps='" + window.data.Sprps + "',Seqnr='" + window.data.Seqnr +
							"',Dte=datetime'" + date_sel + "')";
						batchChanges.push(oModel.createBatchOperation(sEntityPath, "PUT", window.oEntry));
					}
					if (this._oBusyDialog) {
						this._oBusyDialog.close();
					}
					oModel.addBatchChangeOperations(batchChanges);
					this._oBusyDialog = new sap.m.BusyDialog();
					this._oBusyDialog.open();
					var that = this;

					oModel.submitBatch(function (data) {
						//oModel.refresh();
						if (data.__batchResponses[0].__changeResponses) {
							sap.m.MessageToast.show("Updated " + data.__batchResponses[0].__changeResponses.length + " Record(s)");
							//window.view.getModel().refresh(true);
							that.getView().getElementBinding().refresh(true);
							var message1 = $(data.__batchResponses[0].__changeResponses[0].headers["sap-message"])
								.find('message').first()
								.text();
							if (message1) {
								var oSubDialog2 = new sap.m.Dialog({
									title: "Saved with Warning",
									type: "Message",
									state: "Warning",
									content: [new sap.m.Text({
										text: message1
									})]
								});
								oSubDialog2.open();
								oSubDialog2
									.addButton(new sap.m.Button({
										text: "OK",
										press: function () {
											oSubDialog2
												.close();
											if (that._oBusyDialog) {
												that._oBusyDialog.close();
											}
										}
									}));
							}

							if (that._oBusyDialog) {
								that._oBusyDialog.close();
							}
						} else {
							sap.m.MessageToast.show(data.__batchResponses[0].message);
							var message = $(data.__batchResponses[0].response.body)
								.find('message').first()
								.text();
							var oSubDialog1 = new sap.m.Dialog({
								title: "Update failed",
								type: "Message",
								state: "Error",
								content: [new sap.m.Text({
									text: message
								})]
							});
							oSubDialog1.open();
							oSubDialog1
								.addButton(new sap.m.Button({
									text: "OK",
									press: function () {
										oSubDialog1
											.close();
										if (that._oBusyDialog) {
											that._oBusyDialog.close();
										}
									}
								}));
							//window.view.getModel().refresh(true);
							that.getView().getElementBinding().refresh(true);
							if (that._oBusyDialog) {
								that._oBusyDialog.close();
							}
						}
					}, function (err) {
						if (that._oBusyDialog) {
							that._oBusyDialog.close();
						}

					});
				}
			}
		},

		handleSubmitDetails: function () {
			var objps = "01";
			var calendarRef = window.view.byId("weeklyCalendar");
			var selectedDates = calendarRef.getSelectedDates();
			window.view.getController().getdata();
			if (this.checkBeforeSubmitNew() === true) {
				var oModel = new sap.ui.model.odata.ODataModel(
					"/sap/opu/odata/sap/ZHR_TIMESHEET_UI5_SRV/",
					false);
				oModel.setUseBatch(true);
				// oModel.setDeferredGroups(["batchUpdateGroup"]);
				var Id = "batchUpdateGroup";
				var batchChanges = [];
				//oModel.sDefaultUpdateMethod = "PUT";
				var mParameters = {
					"groupId": Id,
					"changeSetId": Id
				};
				if (selectedDates.length !== 0) {
					for (var i = 0; i < selectedDates.length; i++) {
						var date_sel = selectedDates[i].getStartDate();
						var dateFormat = sap.ui.core.format.DateFormat
							.getDateTimeInstance({
								pattern: "yyyy-MM-ddTHH:mm:ss"
							});
						date_sel = dateFormat.format(new Date(date_sel));
						window.oEntry.Dte = date_sel;

						var beg = window.data.Begda.replace(/:/g, "%3A");
						var end = window.data.Endda.replace(/:/g, "%3A");
						date_sel = date_sel.replace(/:/g, "%3A");
						var sEntityPath = "/TimesheetSet(Pernr='" + window.data.Pernr + "',Subty='" + window.data.Subty + "',Objps='" + objps +
							"',Begda=datetime'" + beg + "',Endda=datetime'" + end + "',Sprps='" + window.data.Sprps + "',Seqnr='" + window.data.Seqnr +
							"',Dte=datetime'" + date_sel + "')";

						batchChanges.push(oModel.createBatchOperation(sEntityPath, "PUT", window.oEntry));
					}
					if (this._oBusyDialog) {
						this._oBusyDialog.close();
					}
					oModel.addBatchChangeOperations(batchChanges);
					this._oBusyDialog = new sap.m.BusyDialog();
					this._oBusyDialog.open();
					var that = this;
					oModel.submitBatch(function (data) {
						//oModel.refresh();

						if (data.__batchResponses[0].__changeResponses) {
							sap.m.MessageToast.show("Updated and Submitted " + data.__batchResponses[0].__changeResponses.length + " Record(s)");
							//window.view.getModel().refresh(true);
							that.getView().getElementBinding().refresh(true);
							if (that._oBusyDialog) {
								that._oBusyDialog.close();
							}
						} else {
							//sap.m.MessageToast.show(data.__batchResponses[0].message);
							var message = $(data.__batchResponses[0].response.body)
								.find('message').first()
								.text();
							var oSubDialog1 = new sap.m.Dialog({
								title: "Submit failed",
								type: "Message",
								state: "Error",
								content: [new sap.m.Text({
									text: message
								})]
							});
							oSubDialog1.open();
							oSubDialog1
								.addButton(new sap.m.Button({
									text: "OK",
									press: function () {
										oSubDialog1
											.close();
										if (that._oBusyDialog) {
											that._oBusyDialog.close();
										}
									}
								}));
							//window.view.getModel().refresh(true);
							that.getView().getElementBinding().refresh(true);
							window.termdate = null; // clear term date on any errors from odata service
							data.TermDate = null;
							if (that._oBusyDialog) {
								that._oBusyDialog.close();
							}
						}

					}, function (err) {
						if (that._oBusyDialog) {
							that._oBusyDialog.close();
						}

					});
				}
			}

		},

		// Read Model
		Read: function (path) {
			window.view.bindElement(path);
		},

		handleChangeRange: function (oEvent) {
			this.changeStatusToNone();
			window.calendar.removeAllSelectedDates();
			//var date = oEvent.getParameters().cd;*
			var date = oEvent.getSource().getStartDate();
			var date1 = date;
			//var btn = oEvent.getSource();
			var fromdate = window.data.Begda;
			var todate = window.data.Endda;
			var dateFormat = sap.ui.core.format.DateFormat
				.getDateTimeInstance({
					pattern: "yyyy-MM-ddTHH:mm:ss"
				});
			date = dateFormat.format(new Date(date));
			// get range dates for setting legend
			var dt = new Date(date);
			window.legbeg = dt;
			window.legbeg = dateFormat.format(new Date(window.legbeg));

			dt.setDate(dt.getDate() + 13);
			window.legend = dt;
			window.legend = dateFormat.format(new Date(window.legend));
			todate = dateFormat.format(new Date(todate));
			fromdate = dateFormat.format(new Date(fromdate));
			//set new selected date
			var m = Date.parse(date1);
			var d = new Date(m);
			window.calendar.focusDate(d);
			window.calendar.insertSelectedDate(new sap.ui.unified.DateTypeRange({
				startDate: d
			}));
			window.calendar.setStartDate(d);

			var pernr = window.data.Pernr;
			var subty = '00';
			var objps = '';
			var begda = fromdate;
			var endda = todate;
			var sprps = '';
			var seqnr = '000';
			var day = date;

			var sEntityPath = "/TimesheetSet(Pernr='" + pernr + "',Subty='" + subty + "',Objps='" + objps + "',Begda=datetime'" + begda +
				"',Endda=datetime'" + endda + "',Sprps='" + sprps + "',Seqnr='" + seqnr + "',Dte=datetime'" + day + "')";
			window.path = sEntityPath;
			window.view.getController().Read(sEntityPath);
			this.getView().getElementBinding().refresh(true);
		},

		// Get Screen Data
		getdata: function () {
			var oEntry = {};
			oEntry.Dte = window.data.Dte;
			var fxa = window.flx.getSelected();
			if (fxa === true) {
				oEntry.Fxa = "X";
			} else {
				oEntry.Fxa = "";
			}
			var pts = window.pts.getSelected();
			if (pts === true) {
				oEntry.Pts = "X";
			} else {
				oEntry.Pts = "";
			}

			oEntry.Bga = window.beg1.getValue();
			if (oEntry.Bga === "") {
				oEntry.Bga = "000000";
			}
			oEntry.Eda = window.end1.getValue();
			if (oEntry.Eda === "") {
				oEntry.Eda = "000000";
			}
			oEntry.Bgb = window.beg2.getValue();
			if (oEntry.Bgb === "") {
				oEntry.Bgb = "000000";
			}
			oEntry.Edb = window.end2.getValue();
			if (oEntry.Edb === "") {
				oEntry.Edb = "000000";
			}
			oEntry.Bgc = window.beg3.getValue();
			if (oEntry.Bgc === "") {
				oEntry.Bgc = "000000";
			}
			oEntry.Edc = window.end3.getValue();
			if (oEntry.Edc === "") {
				oEntry.Edc = "000000";
			}
			oEntry.Bgd = window.beg4.getValue();
			if (oEntry.Bgd === "") {
				oEntry.Bgd = "000000";
			}
			oEntry.Edd = window.end4.getValue();
			if (oEntry.Edd === "") {
				oEntry.Edd = "000000";
			}
			oEntry.Resn1 = window.empcomm.getValue();
			oEntry.Flxci = window.cashO.getSelectedKey();
			oEntry.Apname = window.sup.getValue();
			oEntry.Appernr = data.Appernr;
			oEntry.Abs = window.abs.getValue();
			if (oEntry.Abs === "") {
				oEntry.Abs = "000000";
			}
			oEntry.Abs = this.timeStringToDecimal(oEntry.Abs);
			oEntry.Flxad = window.balAdj.getValue();
			oEntry.Flxad = this.timeStringToDecimal((this.convertBalAdjInternalFormat(oEntry.Flxad)));

			//oEntry.TermDate = window.data.TermDate;
			if (data.TermDate) {
				oEntry.TermDate = data.TermDate + "T00:00:00";
			}
			window.oEntry = oEntry;

		},

		//check whether data changed
		isdatachanged: function () {
			if (window.oEntry.Pts === window.data.Pts &&
				window.oEntry.Fxa === window.data.Fxa &&
				window.oEntry.Abs === window.data.Abs &&
				window.oEntry.Bga === window.data.Bga &&
				window.oEntry.Eda === window.data.Eda &&
				window.oEntry.Bgb === window.data.Bgb &&
				window.oEntry.Edb === window.data.Edb
			) {
				// No change
				window.change = '0';
			} else {
				window.change = '1';
			}

		},

		// Initiate Date Change
		changedate: function (date) {
			window.changed = '0';
			var fromdate = window.data.Begda;
			var todate = window.data.Endda;
			var dateFormat = sap.ui.core.format.DateFormat
				.getDateTimeInstance({
					pattern: "yyyy-MM-ddTHH:mm:ss"
				});
			date = dateFormat.format(new Date(date));
			todate = dateFormat.format(new Date(todate));
			fromdate = dateFormat.format(new Date(fromdate));
			// oDate = oDate.replace(/:/g, "%3A");
			var pernr = window.data.Pernr;
			var subty = '00';
			var objps = '';
			var begda = fromdate;
			var endda = todate;
			var sprps = '';
			var seqnr = '000';
			var day = date;

			var sEntityPath = "/TimesheetSet(Pernr='" + pernr + "',Subty='" + subty + "',Objps='" + objps + "',Begda=datetime'" + begda +
				"',Endda=datetime'" + endda + "',Sprps='" + sprps + "',Seqnr='" + seqnr + "',Dte=datetime'" + day + "')";

			window.path = sEntityPath;
			window.view.getController().Read(sEntityPath);
		},

		// Period selection
		handlePeriodDetails: function () {
			this.changeStatusToNone();
			var oController = window.view.getController();
			var oModel = new sap.ui.model.odata.ODataModel(
				"/sap/opu/odata/sap/ZHR_TIMESHEET_UI5_SRV/",
				false);
			oModel
				.read(
					"/PeriodSet",
					null,
					null,
					true,
					function (oData, oResponse) {
						var model = new sap.ui.model.json.JSONModel(
							oData);
						var a = new sap.m.SelectDialog({
							title: "Select Period",
							items: {
								path: "/results",
								template: new sap.m.StandardListItem({
									title: "{Text}",
									description: "{Status}",
									adaptTitleSize: false,
									active: true
								})
							},
							confirm: oController.helpClose,
							liveChange: [
								oController.handlePeriod,
								this
							],
							search: [
								oController.handlePeriod,
								this
							]
						});
						a.setModel(model);
						a.open();
					});
		},

		helpClose: function (oEvent) {
			var selectItem = oEvent.getParameter("selectedItem");
			var data = selectItem.getBindingContext().getObject();
			var fromdate = window.data.Begda;
			var todate = window.data.Endda;
			var dateFormat = sap.ui.core.format.DateFormat
				.getDateTimeInstance({
					pattern: "yyyy-MM-ddTHH:mm:ss"
				});
			// convert date format from dd.mm.yyyy to mm/dd/yyyy as
			// that format is not supported by IE
			var chunks = data.Value.split('.');
			var formattedDate = chunks[1] + '/' + chunks[0] + '/' + chunks[2];
			var date = dateFormat.format(new Date(formattedDate));

			todate = dateFormat.format(new Date(todate));
			fromdate = dateFormat.format(new Date(fromdate));
			// oDate = oDate.replace(/:/g, "%3A");
			var pernr = window.data.Pernr;
			var subty = '00';
			var objps = '';
			var begda = fromdate;
			var endda = todate;
			var sprps = '';
			var seqnr = '000';
			var day = date;

			var sEntityPath = "/TimesheetSet(Pernr='" + pernr + "',Subty='" + subty + "',Objps='" + objps + "',Begda=datetime'" + begda +
				"',Endda=datetime'" + endda + "',Sprps='" + sprps + "',Seqnr='" + seqnr + "',Dte=datetime'" + day + "')";

			window.path = sEntityPath;
			window.view.getController().Read(sEntityPath);
			//Set Dates for Legend
			//var dt = new Date(date);
			var dt = new Date(data.Spbeg);
			window.legbeg = dt;
			window.legbeg = dateFormat.format(new Date(window.legbeg));
			dt.setDate(dt.getDate() + 13);
			window.legend = dt;
			window.legend = dateFormat.format(new Date(window.legend));
		},

		handlePeriod: function (e) {
			var oController = window.view.getController();
			var f = e.getParameter("value");
			f = f.toLowerCase();
			var oFilter = new sap.ui.model.Filter("Text",
				sap.ui.model.FilterOperator.Contains, f);
			var list = e.getSource().getBinding("items").filter(
				[oFilter]);
		},

		handleValueHelpNew: function () {
			var _ = this;
			var s = new sap.m.SelectDialog({
				title: "Delegates",
				noDataText: "No Delegates Found",
				search: _._searchAction,
				liveChange: _._searchAction
			});
			s.open();
			s.fireSearch({
				"value": ""
			});
		},
		_searchAction: function (e) {
			var _ = this;
			if (e.getParameter("value").length > 0 || !isNaN(e.getParameter("value"))) {
				var s = function (d) {
					for (var i = 0; i < d.results.length; i++) {
						if (d.results[i].Pernr === "00000000" || d.results[i].Pernr === "") {
							delete d.results[i];
						}
					}
					var m = new sap.ui.model.json.JSONModel(d);
					var a = new sap.m.StandardListItem({
						title: "{Name}",
						description: "{Pernr}",
						active: "true"
					});
					_.setModel(m);
					_.bindAggregation("items", "/results", a);
					_.attachConfirm(function (e) {

						var _ = ZHR_TIMESHEET_UI5.utils.UIHelper.getControllerInstance();
						var b = e.getParameter("selectedItem");
						var c = new sap.ui.core.CustomData({
							"key": "Name",
							"value": b.getDescription()
						});
						_.byId("idSuper").removeAllCustomData();
						_.byId("idSuper").addCustomData(c);
						_.byId("idSuper").setValue(b.getTitle());

						//Submitted TS..when change in supervisor value..enable submit button and AutoSave as well
						if (data.Appernr !== b.getDescription()) {
							data.Appernr = b.getDescription();
							data.Apname = b.getTitle();
							if (data.status === "02") {
								win.submit.setEnabled(true);
							}
							_.handleAutoSave();
						}

					});
				};
				ZHR_TIMESHEET_UI5.utils.DataManager.searchApprover(e.getParameter("value"), s);
			}

		},

		handlePdfDetails: function () {
			var that = this;
			var calendarRef = window.view.byId("weeklyCalendar");
			debugger;
			var path = "/PrintSet?$filter=Dte eq datetime'" + window.data.Dte + "'";
			var oModel = new sap.ui.model.odata.ODataModel(
				"/sap/opu/odata/sap/ZHR_TIMESHEET_UI5_SRV/",
				false);
			oModel
				.read(
					path,
					null,
					null,
					true,
					function (oData, oResponse) {
						var data = new sap.ui.model.json.JSONModel(
							oData.results);
						var header = '<center><h3>Flex Timesheet</h3><center><hr>' + "<p style='text-align:left'><b>" + window.data.HeaderText +
							"</b><br><b>Status : </b>" + window.data.StatusText + "</p>";
						var i;
						var table = "<table style='text-align:left' border='0' cellspacing='0' cellpadding='0' width='1047'>" +
							"<tbody><tr><td width='90' nowrap='' valign='bottom'>" +
							"<p align='center'><strong>Day</strong></p></td>" +
							"<td width='90' nowrap='' valign='bottom'><p align='center'><strong>Date</strong></p></td>" +
							"<td width='52' nowrap='' valign='bottom'><p align='center'><strong>Start1</strong></p></td>" +
							"<td width='52' nowrap='' valign='bottom'><p align='center'><strong>Finish1</strong></p></td>" +
							"<td width='52' nowrap='' valign='bottom'><p align='center'><strong>Start2</strong></p></td>" +
							"<td width='52' nowrap='' valign='bottom'><p align='center'><strong>Finish2</strong></p></td>" +
							"<td width='52' nowrap='' valign='bottom'><p align='center'><strong>Start3</strong></p></td>" +
							"<td width='52' nowrap='' valign='bottom'><p align='center'><strong>Finish3</strong></p></td>" +
							"<td width='52' nowrap='' valign='bottom'><p align='center'><strong>Start4</strong></p></td>" +
							"<td width='52' nowrap='' valign='bottom'><p align='center'><strong>Finish4</strong></p></td>" +
							"<td width='52' nowrap='' valign='bottom'><p align='center'><strong>Part Time Day Swap</strong></p></td>" +
							"<td width='52' nowrap='' valign='bottom'><p align='center'><strong>All Day Flex</strong></p></td>" +
							"<td width='52' nowrap='' valign='bottom'><p align='center'><strong>Additional Absence Hours</strong></p></td>" +
							"<td width='52' nowrap='' valign='bottom'><p align='center'><strong>Leave/Public Holiday</strong></p></td>" +
							"<td width='52' nowrap='' valign='bottom'><p align='center'><strong>OverTime Hours</strong></p></td>" +
							"<td width='52' nowrap='' valign='bottom'><p align='center'><strong>Standard Hours</strong></p></td>" +
							"<td width='52' nowrap='' valign='bottom'><p align='center'><strong>Total Hours</strong></p></td>" +
							"<td width='52' nowrap='' valign='bottom'><p align='center'><strong>Flex Balance</strong></p></td>";

						for (i = 0; i < 28; i++) {
							var dateFormat = sap.ui.core.format.DateFormat
								.getInstance({
									pattern: "dd/MM/yyyy"
								});
							var date = dateFormat
								.format(new Date(
									oData.results[i].Dte));

							if (oData.results[i].Bga === "000000") {
								oData.results[i].Bga = "";

							} else {
								var h = oData.results[i].Bga
									.substring(0, 2);
								var m = oData.results[i].Bga
									.substring(2, 4);
								oData.results[i].Bga = h + ":" + m;
							}

							if (oData.results[i].Bgb === "000000") {
								oData.results[i].Bgb = "";
							} else {
								var h = oData.results[i].Bgb
									.substring(0, 2);
								var m = oData.results[i].Bgb
									.substring(2, 4);
								oData.results[i].Bgb = h + ":" + m;
							}
							if (oData.results[i].Bgc === "000000") {
								oData.results[i].Bgc = "";
							} else {
								var h = oData.results[i].Bgc
									.substring(0, 2);
								var m = oData.results[i].Bgc
									.substring(2, 4);
								oData.results[i].Bgc = h + ":" + m;

							}
							if (oData.results[i].Bgd === "000000") {
								oData.results[i].Bgd = "";
							} else {
								var h = oData.results[i].Bgd
									.substring(0, 2);
								var m = oData.results[i].Bgd
									.substring(2, 4);
								oData.results[i].Bgd = h + ":" + m;
							}
							if (oData.results[i].Eda === "000000") {
								oData.results[i].Eda = "";
							} else {
								var h = oData.results[i].Eda
									.substring(0, 2);
								var m = oData.results[i].Eda
									.substring(2, 4);
								oData.results[i].Eda = h + ":" + m;
							}
							if (oData.results[i].Edb === "000000") {
								oData.results[i].Edb = "";
							} else {
								var h = oData.results[i].Edb
									.substring(0, 2);
								var m = oData.results[i].Edb
									.substring(2, 4);
								oData.results[i].Edb = h + ":" + m;
							}
							if (oData.results[i].Edc === "000000") {
								oData.results[i].Edc = "";
							} else {
								var h = oData.results[i].Edc
									.substring(0, 2);
								var m = oData.results[i].Edc
									.substring(2, 4);
								oData.results[i].Edc = h + ":" + m;
							}
							if (oData.results[i].Edd === "000000") {
								oData.results[i].Edd = "";
							} else {
								var h = oData.results[i].Edd
									.substring(0, 2);
								var m = oData.results[i].Edd
									.substring(2, 4);
								oData.results[i].Edd = h + ":" + m;
							}
							if (oData.results[i].Abs === "000000") {
								oData.results[i].Abs = "";
							} else {
								oData.results[i].Abs = that.decimalToTimeString(oData.results[i].Abs);
							}
							if (oData.results[i].Lve === "000000") {
								oData.results[i].Lve = "";
							} else {
								oData.results[i].Lve = that.decimalToTimeString(oData.results[i].Lve);
							}
							if (oData.results[i].Oth === "000000") {
								oData.results[i].Oth = "";
							} else {
								oData.results[i].Oth = that.decimalToTimeString(oData.results[i].Oth);
							}
							if (oData.results[i].Std === "000000") {
								oData.results[i].Std = "";
							} else {
								oData.results[i].Std = that.decimalToTimeString(oData.results[i].Std);
							}
							if (oData.results[i].Ttl === "000000") {
								oData.results[i].Ttl = "";
							} else {
								oData.results[i].Ttl = that.decimalToTimeString(oData.results[i].Ttl);
							}
							if (oData.results[i].Fbl === "000000") {
								oData.results[i].Fbl = "";
							} else {
								oData.results[i].Fbl = that.decimalToTimeString(oData.results[i].Fbl);
							}

							var color = " ";
							if (oData.results[i].Std === "00:00") {
								color = "#e5e5e5";
							}
							//Approved Leave -#00bfff
							// PTNW -#008a3b
							// NoFlex - #ff6500
							// Public Holiday - #f0ab00
							// unapproved Leave -#e52929
							table += "<tr bgcolor=" + ' " ' + color + '" >';
							table += "<td width='90' style= 'border: 1px solid black;" +
								"' valign='bottom'>" +
								"<p align='center'>" + oData.results[i].Day + "</p></td>" +
								"<td width='90' style= 'border: 1px solid black; valign='bottom'><p align='center'>" + date + "</p></td>" +
								"<td width='52' style= 'border: 1px solid black; valign='bottom'><p align='center'>" + oData.results[i].Bga + "</p></td>" +
								"<td width='52' style= 'border: 1px solid black; valign='bottom'><p align='center'>" + oData.results[i].Eda + "</p></td>" +
								"<td width='52' style= 'border: 1px solid black; valign='bottom'><p align='center'>" + oData.results[i].Bgb + "</p></td>" +
								"<td width='52' style= 'border: 1px solid black; valign='bottom'><p align='center'>" + oData.results[i].Edb + "</p></td>" +
								"<td width='52' style= 'border: 1px solid black; valign='bottom'><p align='center'>" + oData.results[i].Bgc + "</p></td>" +
								"<td width='52' style= 'border: 1px solid black; valign='bottom'><p align='center'>" + oData.results[i].Edc + "</p></td>" +
								"<td width='52' style= 'border: 1px solid black; valign='bottom'><p align='center'>" + oData.results[i].Bgd + "</p></td>" +
								"<td width='52' style= 'border: 1px solid black; valign='bottom'><p align='center'>" + oData.results[i].Edd + "</p></td>" +
								"<td width='52' style= 'border: 1px solid black; valign='bottom'><p align='center'>" + oData.results[i].Pts + "</p></td>" +
								"<td width='52' style= 'border: 1px solid black; valign='bottom'><p align='center'>" + oData.results[i].Fxa + "</p></td>" +
								"<td width='52' style= 'border: 1px solid black; valign='bottom'><p align='center'>" + oData.results[i].Abs + "</p></td>" +
								"<td width='52' style= 'border: 1px solid black; valign='bottom'><p align='center'>" + oData.results[i].Lve + "</p></td>" +
								"<td width='52' style= 'border: 1px solid black; valign='bottom'><p align='center'>" + oData.results[i].Oth + "</p></td>" +
								"<td width='52' style= 'border: 1px solid black; valign='bottom'><p align='center'>" + oData.results[i].Std + "</p></td>" +
								"<td width='52' style= 'border: 1px solid black; valign='bottom'><p align='center'>" + oData.results[i].Ttl + "</p></td>" +
								"<td width='52' style= 'border: 1px solid black; valign='bottom'><p align='center'>" + oData.results[i].Fbl + "</p></td>" +
								"</p></td></tr>";
						}
						table += "</tbody></table>";
						var dateFormat = sap.ui.core.format.DateFormat
							.getInstance({
								pattern: "dd/MM/yyyy"
							});
						var date = dateFormat
							.format(new Date(
								window.data.Apdte));
						var footera;
						var footerb;
						var footer;
						if (window.data.Apdte !== null) {
							footerb = "<b>Approval Date : </b>" + date;
						} else {
							footerb = " ";
						}

						footera = "<p style='text-align:left'>" + "<b>Opening Balance :  </b>" + that.decimalToTimeString(window.data.Flxop) +
							" &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; " + "<b>Closing Balance :  </b>" + that.decimalToTimeString(window.data.Flxbl);
						//"<b>Balance Adjustment :  </b>" + that.decimalToTimeString(window.data.Flxad) + "         " + "<b>Closing Balance :  </b>" +
						//that.decimalToTimeString(window.data.Flxbl); // + "         "  + "<b>Cash out :  </b>" + that.decimalToTimeString(window.data.Flxco);

						var s = new Date(); // today's date  
						var dateFormat1 = sap.ui.core.format.DateFormat
						.getDateTimeInstance({
							pattern: "yyyy-MM-dd"
						});
						var s1 = dateFormat1.format(new Date(window.data.Spbeg)); // Settlement Period Start Date
						var m1 = Date.parse(s1);
						var d = new Date(m1);
						var noDisplay;
						if (+d > +s) {  //Future Settlement Periods..
							noDisplay = "X";
						}

						// hide full form if both are not required or future dates..	
						if ((window.data.Flxen === "" && window.data.Fcoen === "") || (noDisplay === "X")) {
							footer = footera + "</p>";
						} else {
							footera = footera + "<br><b>Balance Adjustment :  </b>" + that.decimalToTimeString(window.data.Flxad) +
								" &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; " + "<b>Cash out :  </b>" + that.decimalToTimeString(
									window.data.Flxco);
							footer = footera + "<br><b>Employee Comments : </b>" + window.data.Resn1 + "<br><b>Supervisor : </b>" + oData.results[0].Super +
								" &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; " + footerb + "<br><b>Supervisor Comments : </b>" + window.data.Resn2 + "</p>";
						}

						var ctrlString = "width=1200px,height=900px,resizable=yes,scrollbars=yes";
						var wind = window.open("", "PrintWindow", ctrlString);
						wind.document.write(header + table + "<br>" + footer);
						wind.document.close();
						wind.focus();
						//wind.print();
						//	wind.close();

					});

		}
	});
});