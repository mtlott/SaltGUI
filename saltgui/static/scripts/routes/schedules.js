class SchedulesRoute extends PageRoute {

  constructor(router) {
    super("^[\/]schedules$", "Schedules", "#page_schedules", "#button_schedules", router);
    this.keysLoaded = false;
    this.jobsLoaded = false;

    this._updateKeys = this._updateKeys.bind(this);
    this._updateMinion = this._updateMinion.bind(this);
  }

  onShow() {
    const minions = this;

    return new Promise(function(resolve, reject) {
      minions.resolvePromise = resolve;
      if(minions.keysLoaded && minions.jobsLoaded) resolve();
      minions.router.api.getScheduleList(null)
        .then(minions._updateMinions, minions._updateMinions);
      minions.router.api.getKeys().then(minions._updateKeys);
      minions.router.api.getJobs().then(minions._updateJobs);
    });
  }

  // This one has some historic ballast:
  // Meta-data is returned on the same level as
  // the list of scheduled items
  static _fixMinion(data) {
    const ret = { "schedules": {}, "enabled": true };
    for(const k in data) {
      if(k === "enabled") {
        ret.enabled = data.enabled;
        continue;
      }
      if(k === "schedule" && JSON.stringify(data[k]) === "{}") {
        continue;
      }
      ret.schedules[k] = data[k];
    }
    return ret;
  }

  _updateKeys(data) {
    const keys = data.return;

    const list = this.getPageElement().querySelector('#minions');

    const hostnames = keys.minions.sort();
    for(const hostname of hostnames) {
      this._addMinion(list, hostname);
    }

    this.keysLoaded = true;
    if(this.keysLoaded && this.jobsLoaded) this.resolvePromise();
  }

  _updateMinion(container, minion, hostname) {

    minion = SchedulesRoute._fixMinion(minion);

    const cnt = Object.keys(minion.schedules).length;
    let scheduleinfo = cnt + " schedule" + (cnt == 1 ? "" : "s");
    if(!minion.enabled)
      scheduleinfo += " (disabled)";

    let element = document.getElementById(hostname);
    if(element == null) {
      // offline minion not found on screen...
      // construct a basic element that can be updated here
      element = document.createElement('li');
      element.id = hostname;
      container.appendChild(element);
    }
    while(element.firstChild) {
      element.removeChild(element.firstChild);
    }

    element.appendChild(Route._createDiv("hostname", hostname));

    const statusDiv = Route._createDiv("status", "accepted");
    statusDiv.classList.add("accepted");
    element.appendChild(statusDiv);

    element.appendChild(Route._createDiv("scheduleinfo", scheduleinfo));

    const menu = new DropDownMenu(element);
    menu.addMenuItem("Show&nbsp;schedules", function(evt) {
      window.location.assign("schedulesminion?minion=" + encodeURIComponent(hostname));
    }.bind(this));
  }
}
