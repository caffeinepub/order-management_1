import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Array "mo:core/Array";

actor {
  // ─── Types ──────────────────────────────────────────────────────────────

  type Order = {
    id : Nat;
    consumerNo : Text;
    contactNo : Text;
    customerName : Text;
    address : Text;
    product : Text;
    amountText : Text;
    expectedPaymentDate : Text;
    status : Text;
    holdFlag : Bool;
    allClearFlag : Bool;
    createdAt : Int;
    updatedAt : Int;
    createdBy : Principal;
  };

  type AppUser = {
    id : Nat;
    userPrincipal : Principal;
    username : Text;
    roleIds : [Nat];
    createdAt : Int;
  };

  type AppRole = {
    id : Nat;
    roleName : Text;
    roleDescription : Text;
  };

  type Stage = {
    id : Nat;
    stageName : Text;
    stageOrder : Nat;
    roleIds : [Nat];
  };

  type OrderStage = {
    id : Nat;
    orderId : Nat;
    stageId : Nat;
    completed : Bool;
    completedDate : Text;
    manualDateOverride : Text;
    note : Text;
    completedBy : Principal;
  };

  type AuditEntry = {
    id : Nat;
    action : Text;
    entityType : Text;
    entityId : Nat;
    performedBy : Principal;
    timestamp : Int;
    detail : Text;
  };

  type Setting = {
    key : Text;
    value : Text;
  };

  type OrderUpdate = {
    id : Nat;
    orderId : Nat;
    text : Text;
    createdBy : Principal;
    createdAt : Int;
  };

  // ─── State ───────────────────────────────────────────────────────────────

  var nextOrderId = 1;
  let orders = Map.empty<Nat, Order>();

  let users = Map.empty<Nat, AppUser>();
  let roles = Map.empty<Nat, AppRole>();
  let principalToUserId = Map.empty<Principal, Nat>();
  var userCounter = 1;
  var roleCounter = 3;

  let stages = Map.empty<Nat, Stage>();
  var stageCounter = 1;

  let orderStages = Map.empty<Nat, OrderStage>();
  var orderStageCounter = 1;

  let auditLog = Map.empty<Nat, AuditEntry>();
  var auditCounter = 1;

  let settings = Map.empty<Text, Setting>();

  let orderUpdates = Map.empty<Nat, OrderUpdate>();
  var updateCounter = 1;

  // Seed roles
  do {
    roles.add(1, { id = 1; roleName = "Admin"; roleDescription = "Administrator" });
    roles.add(2, { id = 2; roleName = "Manager"; roleDescription = "Manager" });
  };

  // ─── Private Helpers ─────────────────────────────────────────────────────

  private func hasRole(roleIds : [Nat], target : Nat) : Bool {
    for (r in roleIds.vals()) {
      if (r == target) { return true };
    };
    false;
  };

  private func rolesIntersect(a : [Nat], b : [Nat]) : Bool {
    for (r in a.vals()) {
      if (hasRole(b, r)) { return true };
    };
    false;
  };

  private func isAdmin(p : Principal) : Bool {
    switch (principalToUserId.get(p)) {
      case (null) { false };
      case (?uid) {
        switch (users.get(uid)) {
          case (null) { false };
          case (?user) { hasRole(user.roleIds, 1) };
        };
      };
    };
  };

  private func isManagerOrAdmin(p : Principal) : Bool {
    switch (principalToUserId.get(p)) {
      case (null) { false };
      case (?uid) {
        switch (users.get(uid)) {
          case (null) { false };
          case (?user) {
            hasRole(user.roleIds, 1) or hasRole(user.roleIds, 2);
          };
        };
      };
    };
  };

  private func isRegistered(p : Principal) : Bool {
    principalToUserId.containsKey(p);
  };

  private func getUserRoleIds(p : Principal) : [Nat] {
    switch (principalToUserId.get(p)) {
      case (null) { [] };
      case (?uid) {
        switch (users.get(uid)) {
          case (null) { [] };
          case (?user) { user.roleIds };
        };
      };
    };
  };

  private func appendAudit(action : Text, entityType : Text, entityId : Nat, performedBy : Principal, detail : Text) {
    let id = auditCounter;
    auditCounter += 1;
    auditLog.add(id, {
      id;
      action;
      entityType;
      entityId;
      performedBy;
      timestamp = Time.now();
      detail;
    });
  };

  private func initOrderStages(orderId : Nat) {
    let allStages = stages.values().toArray();
    for (stage in allStages.vals()) {
      let osId = orderStageCounter;
      orderStageCounter += 1;
      orderStages.add(osId, {
        id = osId;
        orderId;
        stageId = stage.id;
        completed = false;
        completedDate = "";
        manualDateOverride = "";
        note = "";
        completedBy = Principal.fromText("aaaaa-aa");
      });
    };
  };

  // ─── User / Role APIs ────────────────────────────────────────────────────

  public shared ({ caller }) func registerSelf(username : Text) : async Text {
    if (isRegistered(caller)) { return "already_registered" };
    let uid = userCounter;
    userCounter += 1;
    let roleIds : [Nat] = if (uid == 1) { [1] } else { [] };
    let user : AppUser = {
      id = uid;
      userPrincipal = caller;
      username;
      roleIds;
      createdAt = Time.now();
    };
    users.add(uid, user);
    principalToUserId.add(caller, uid);
    "ok";
  };

  public query ({ caller }) func getCurrentUser() : async ?AppUser {
    switch (principalToUserId.get(caller)) {
      case (null) { null };
      case (?uid) { users.get(uid) };
    };
  };

  public query ({ caller }) func listUsers() : async [AppUser] {
    if (not isAdmin(caller)) { return [] };
    users.values().toArray();
  };

  public shared ({ caller }) func assignRoles(userId : Nat, roleIds : [Nat]) : async Text {
    if (not isAdmin(caller)) { return "unauthorized" };
    switch (users.get(userId)) {
      case (null) { "not_found" };
      case (?user) {
        users.add(userId, { id = user.id; userPrincipal = user.userPrincipal; username = user.username; roleIds; createdAt = user.createdAt });
        "ok";
      };
    };
  };

  public shared ({ caller }) func deleteUser(userId : Nat) : async Text {
    if (not isAdmin(caller)) { return "unauthorized" };
    switch (users.get(userId)) {
      case (null) { "not_found" };
      case (?user) {
        users.remove(userId);
        principalToUserId.remove(user.userPrincipal);
        "ok";
      };
    };
  };

  public shared ({ caller }) func createRole(name : Text, desc : Text) : async Text {
    if (not isAdmin(caller)) { return "unauthorized" };
    let rid = roleCounter;
    roleCounter += 1;
    roles.add(rid, { id = rid; roleName = name; roleDescription = desc });
    "ok";
  };

  public query func listRoles() : async [AppRole] {
    roles.values().toArray();
  };

  // ─── Stage APIs ──────────────────────────────────────────────────────────

  public shared ({ caller }) func createStage(name : Text, order : Nat, roleIds : [Nat]) : async Text {
    if (not isAdmin(caller)) { return "unauthorized" };
    let id = stageCounter;
    stageCounter += 1;
    stages.add(id, { id; stageName = name; stageOrder = order; roleIds });
    "ok";
  };

  public query func listStages() : async [Stage] {
    let arr = stages.values().toArray();
    arr.sort(func(a, b) { Nat.compare(a.stageOrder, b.stageOrder) });
  };

  public shared ({ caller }) func updateStage(id : Nat, name : Text, order : Nat, roleIds : [Nat]) : async Text {
    if (not isAdmin(caller)) { return "unauthorized" };
    switch (stages.get(id)) {
      case (null) { "not_found" };
      case (_) {
        stages.add(id, { id; stageName = name; stageOrder = order; roleIds });
        "ok";
      };
    };
  };

  public shared ({ caller }) func deleteStage(id : Nat) : async Text {
    if (not isAdmin(caller)) { return "unauthorized" };
    if (not stages.containsKey(id)) { return "not_found" };
    stages.remove(id);
    "ok";
  };

  public shared ({ caller }) func reorderStage(id : Nat, newOrder : Nat) : async Text {
    if (not isAdmin(caller)) { return "unauthorized" };
    switch (stages.get(id)) {
      case (null) { "not_found" };
      case (?stage) {
        stages.add(id, { id = stage.id; stageName = stage.stageName; stageOrder = newOrder; roleIds = stage.roleIds });
        "ok";
      };
    };
  };

  // ─── OrderStage APIs ─────────────────────────────────────────────────────

  public shared ({ caller }) func completeStage(orderId : Nat, stageId : Nat, note : Text) : async Text {
    if (not isRegistered(caller)) { return "unauthorized" };
    switch (stages.get(stageId)) {
      case (null) { return "stage_not_found" };
      case (?stage) {
        let callerRoles = getUserRoleIds(caller);
        if (stage.roleIds.size() > 0 and not rolesIntersect(callerRoles, stage.roleIds)) {
          return "unauthorized";
        };
        var found = false;
        for ((k, os) in orderStages.entries()) {
          if (os.orderId == orderId and os.stageId == stageId and not os.completed) {
            let now = Time.now();
            orderStages.add(k, {
              id = os.id;
              orderId;
              stageId;
              completed = true;
              completedDate = now.toText();
              manualDateOverride = os.manualDateOverride;
              note;
              completedBy = caller;
            });
            found := true;
          };
        };
        if (not found) { return "not_found" };
        appendAudit("completeStage", "OrderStage", orderId, caller, "stageId:" # stageId.toText());
        "ok";
      };
    };
  };

  public shared ({ caller }) func overrideStageDate(orderId : Nat, stageId : Nat, date : Text, note : Text) : async Text {
    if (not isManagerOrAdmin(caller)) { return "unauthorized" };
    var found = false;
    for ((k, os) in orderStages.entries()) {
      if (os.orderId == orderId and os.stageId == stageId) {
        orderStages.add(k, {
          id = os.id;
          orderId = os.orderId;
          stageId = os.stageId;
          completed = os.completed;
          completedDate = os.completedDate;
          manualDateOverride = date;
          note;
          completedBy = os.completedBy;
        });
        found := true;
      };
    };
    if (not found) { return "not_found" };
    "ok";
  };

  public query ({ caller }) func listOrderStages(orderId : Nat) : async [OrderStage] {
    if (not isRegistered(caller)) { return [] };
    let arr = orderStages.values().toArray();
    let filtered = arr.filter(func(os : OrderStage) : Bool { os.orderId == orderId });
    filtered.sort(func(a, b) {
      switch (stages.get(a.stageId), stages.get(b.stageId)) {
        case (?sa, ?sb) { Nat.compare(sa.stageOrder, sb.stageOrder) };
        case _ { Nat.compare(a.stageId, b.stageId) };
      };
    });
  };

  // ─── Hold APIs ───────────────────────────────────────────────────────────

  public shared ({ caller }) func markHold(orderId : Nat) : async Text {
    if (not isManagerOrAdmin(caller)) { return "unauthorized" };
    switch (orders.get(orderId)) {
      case (null) { "not_found" };
      case (?o) {
        orders.add(orderId, { id = o.id; consumerNo = o.consumerNo; contactNo = o.contactNo; customerName = o.customerName; address = o.address; product = o.product; amountText = o.amountText; expectedPaymentDate = o.expectedPaymentDate; status = o.status; holdFlag = true; allClearFlag = o.allClearFlag; createdAt = o.createdAt; updatedAt = Time.now(); createdBy = o.createdBy });
        appendAudit("markHold", "Order", orderId, caller, "");
        "ok";
      };
    };
  };

  public shared ({ caller }) func unmarkHold(orderId : Nat) : async Text {
    if (not isManagerOrAdmin(caller)) { return "unauthorized" };
    switch (orders.get(orderId)) {
      case (null) { "not_found" };
      case (?o) {
        orders.add(orderId, { id = o.id; consumerNo = o.consumerNo; contactNo = o.contactNo; customerName = o.customerName; address = o.address; product = o.product; amountText = o.amountText; expectedPaymentDate = o.expectedPaymentDate; status = o.status; holdFlag = false; allClearFlag = o.allClearFlag; createdAt = o.createdAt; updatedAt = Time.now(); createdBy = o.createdBy });
        appendAudit("unmarkHold", "Order", orderId, caller, "");
        "ok";
      };
    };
  };

  public query ({ caller }) func listHeld() : async [Order] {
    if (not isRegistered(caller)) { return [] };
    let callerRoles = getUserRoleIds(caller);
    let allOrders = orders.values().toArray();
    allOrders.filter(func(o : Order) : Bool {
      if (not o.holdFlag) { return false };
      let osArr = orderStages.values().toArray();
      var matches = false;
      for (os in osArr.vals()) {
        if (os.orderId == o.id) {
          switch (stages.get(os.stageId)) {
            case (?stage) {
              if (rolesIntersect(callerRoles, stage.roleIds)) { matches := true };
            };
            case (null) {};
          };
        };
      };
      matches;
    });
  };

  // ─── AllClear APIs ───────────────────────────────────────────────────────

  public shared ({ caller }) func markAllClear(orderId : Nat) : async Text {
    if (not isManagerOrAdmin(caller)) { return "unauthorized" };
    switch (orders.get(orderId)) {
      case (null) { "not_found" };
      case (?o) {
        orders.add(orderId, { id = o.id; consumerNo = o.consumerNo; contactNo = o.contactNo; customerName = o.customerName; address = o.address; product = o.product; amountText = o.amountText; expectedPaymentDate = o.expectedPaymentDate; status = o.status; holdFlag = o.holdFlag; allClearFlag = true; createdAt = o.createdAt; updatedAt = Time.now(); createdBy = o.createdBy });
        appendAudit("markAllClear", "Order", orderId, caller, "");
        "ok";
      };
    };
  };

  public shared ({ caller }) func unmarkAllClear(orderId : Nat) : async Text {
    if (not isManagerOrAdmin(caller)) { return "unauthorized" };
    switch (orders.get(orderId)) {
      case (null) { "not_found" };
      case (?o) {
        orders.add(orderId, { id = o.id; consumerNo = o.consumerNo; contactNo = o.contactNo; customerName = o.customerName; address = o.address; product = o.product; amountText = o.amountText; expectedPaymentDate = o.expectedPaymentDate; status = o.status; holdFlag = o.holdFlag; allClearFlag = false; createdAt = o.createdAt; updatedAt = Time.now(); createdBy = o.createdBy });
        appendAudit("unmarkAllClear", "Order", orderId, caller, "");
        "ok";
      };
    };
  };

  public query ({ caller }) func listAllClear() : async [Order] {
    if (not isRegistered(caller)) { return [] };
    orders.values().toArray().filter(func(o : Order) : Bool { o.allClearFlag });
  };

  // ─── Pending ─────────────────────────────────────────────────────────────

  public query ({ caller }) func listPending() : async [Order] {
    if (not isRegistered(caller)) { return [] };
    let callerRoles = getUserRoleIds(caller);
    let allOrders = orders.values().toArray();
    allOrders.filter(func(o : Order) : Bool {
      let osArr = orderStages.values().toArray();
      let forOrder = osArr.filter(func(os : OrderStage) : Bool { os.orderId == o.id });
      let sorted = forOrder.sort(func(a, b) {
        switch (stages.get(a.stageId), stages.get(b.stageId)) {
          case (?sa, ?sb) { Nat.compare(sa.stageOrder, sb.stageOrder) };
          case _ { Nat.compare(a.stageId, b.stageId) };
        };
      });
      var found = false;
      for (os in sorted.vals()) {
        if (not found and not os.completed) {
          switch (stages.get(os.stageId)) {
            case (?stage) {
              if (rolesIntersect(callerRoles, stage.roleIds)) { found := true };
            };
            case (null) {};
          };
        };
      };
      found;
    });
  };

  // ─── Payment ─────────────────────────────────────────────────────────────

  public query ({ caller }) func listExpectedPayment() : async [Order] {
    if (not isRegistered(caller)) { return [] };
    orders.values().toArray().filter(func(o : Order) : Bool {
      o.expectedPaymentDate.size() > 0;
    });
  };

  public query ({ caller }) func listCollectToday(today : Text) : async [Order] {
    if (not isRegistered(caller)) { return [] };
    orders.values().toArray().filter(func(o : Order) : Bool {
      o.expectedPaymentDate == today;
    });
  };

  // ─── Updates Feed ────────────────────────────────────────────────────────

  public shared ({ caller }) func addUpdate(orderId : Nat, text : Text) : async Text {
    if (not isRegistered(caller)) { return "unauthorized" };
    if (not orders.containsKey(orderId)) { return "not_found" };
    let id = updateCounter;
    updateCounter += 1;
    orderUpdates.add(id, {
      id;
      orderId;
      text;
      createdBy = caller;
      createdAt = Time.now();
    });
    "ok";
  };

  public query ({ caller }) func listUpdates(orderId : Nat) : async [OrderUpdate] {
    if (not isRegistered(caller)) { return [] };
    orderUpdates.values().toArray().filter(func(u : OrderUpdate) : Bool { u.orderId == orderId });
  };

  // ─── Audit Log ───────────────────────────────────────────────────────────

  public query ({ caller }) func listAuditLog() : async [AuditEntry] {
    if (not isAdmin(caller)) { return [] };
    let arr = auditLog.values().toArray();
    arr.sort(func(a, b) { Int.compare(b.timestamp, a.timestamp) });
  };

  // ─── Settings ────────────────────────────────────────────────────────────

  public query func getSetting(key : Text) : async ?Text {
    switch (settings.get(key)) {
      case (null) { null };
      case (?s) { ?s.value };
    };
  };

  public shared ({ caller }) func setSetting(key : Text, value : Text) : async Text {
    if (not isAdmin(caller)) { return "unauthorized" };
    settings.add(key, { key; value });
    "ok";
  };

  // ─── Order APIs ──────────────────────────────────────────────────────────

  public shared ({ caller }) func createOrder(
    consumerNo : Text,
    contactNo : Text,
    customerName : Text,
    address : Text,
    product : Text,
    amountText : Text,
    expectedPaymentDate : Text,
  ) : async Nat {
    if (not isRegistered(caller)) { return 0 };
    let id = nextOrderId;
    nextOrderId += 1;
    let now = Time.now();
    let order : Order = {
      id;
      consumerNo;
      contactNo;
      customerName;
      address;
      product;
      amountText;
      expectedPaymentDate;
      status = "active";
      holdFlag = false;
      allClearFlag = false;
      createdAt = now;
      updatedAt = now;
      createdBy = caller;
    };
    orders.add(id, order);
    initOrderStages(id);
    appendAudit("create", "Order", id, caller, "");
    id;
  };

  public query ({ caller }) func getOrder(id : Nat) : async ?Order {
    orders.get(id);
  };

  public shared ({ caller }) func updateOrder(
    id : Nat,
    consumerNo : Text,
    contactNo : Text,
    customerName : Text,
    address : Text,
    product : Text,
    amountText : Text,
    expectedPaymentDate : Text,
    status : Text,
  ) : async Bool {
    if (not isManagerOrAdmin(caller)) { return false };
    switch (orders.get(id)) {
      case (null) { false };
      case (?o) {
        orders.add(id, { id; consumerNo; contactNo; customerName; address; product; amountText; expectedPaymentDate; status; holdFlag = o.holdFlag; allClearFlag = o.allClearFlag; createdAt = o.createdAt; updatedAt = Time.now(); createdBy = o.createdBy });
        appendAudit("update", "Order", id, caller, "");
        true;
      };
    };
  };

  public shared ({ caller }) func setHoldFlag(id : Nat, value : Bool) : async Bool {
    if (not isManagerOrAdmin(caller)) { return false };
    switch (orders.get(id)) {
      case (null) { false };
      case (?o) {
        orders.add(id, { id = o.id; consumerNo = o.consumerNo; contactNo = o.contactNo; customerName = o.customerName; address = o.address; product = o.product; amountText = o.amountText; expectedPaymentDate = o.expectedPaymentDate; status = o.status; holdFlag = value; allClearFlag = o.allClearFlag; createdAt = o.createdAt; updatedAt = Time.now(); createdBy = o.createdBy });
        true;
      };
    };
  };

  public shared ({ caller }) func setAllClearFlag(id : Nat, value : Bool) : async Bool {
    if (not isManagerOrAdmin(caller)) { return false };
    switch (orders.get(id)) {
      case (null) { false };
      case (?o) {
        orders.add(id, { id = o.id; consumerNo = o.consumerNo; contactNo = o.contactNo; customerName = o.customerName; address = o.address; product = o.product; amountText = o.amountText; expectedPaymentDate = o.expectedPaymentDate; status = o.status; holdFlag = o.holdFlag; allClearFlag = value; createdAt = o.createdAt; updatedAt = Time.now(); createdBy = o.createdBy });
        true;
      };
    };
  };

  public shared ({ caller }) func deleteOrder(id : Nat) : async Bool {
    if (not isAdmin(caller)) { return false };
    let existed = orders.containsKey(id);
    if (existed) {
      orders.remove(id);
      appendAudit("delete", "Order", id, caller, "");
    };
    existed;
  };

  public query ({ caller }) func listOrders(page : Nat, pageSize : Nat) : async {
    orders : [Order];
    total : Nat;
  } {
    if (not isRegistered(caller)) { return { orders = []; total = 0 } };
    let allOrders = orders.values().toArray().sort(func(a, b) { Nat.compare(a.id, b.id) });
    let totalOrders = allOrders.size();
    // page is 1-based; guard against page=0
    let safePage : Nat = if (page == 0) { 1 } else { page };
    let startIndex : Nat = (safePage - 1) * pageSize;
    if (startIndex >= totalOrders) {
      return { orders = []; total = totalOrders };
    };
    let endIndex : Nat = if (startIndex + pageSize > totalOrders) { totalOrders } else { startIndex + pageSize };
    { orders = allOrders.sliceToArray(startIndex, endIndex); total = totalOrders };
  };

  public query func searchOrders(searchQuery : Text) : async [Order] {
    if (searchQuery.size() == 0) { return [] };
    let lowerQuery = searchQuery.toLower();
    orders.values().toArray().filter(func(order : Order) : Bool {
      order.consumerNo.toLower().contains(#text(lowerQuery)) or
      order.contactNo.toLower().contains(#text(lowerQuery));
    });
  };
};
