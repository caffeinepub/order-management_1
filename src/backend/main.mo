import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Float "mo:core/Float";
import Int "mo:core/Int";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Text "mo:core/Text";
import List "mo:core/List";



actor {
  // Types
  type Order = {
    id : Nat;
    orderId : Text;
    consumerNo : Text;
    contactNo : Text;
    customerName : Text;
    address : Text;
    orderDate : Text;
    expectedDelivery : Text;
    product : Text;
    quantity : Nat;
    amount : Float;
    paymentStatus : Text;
    paymentDate : Text;
    collectDate : Text;
    status : Text;
    notes : Text;
    createdBy : Principal;
    createdAt : Int;
    updatedAt : Int;
    isHeld : Bool;
    isAllClear : Bool;
  };

  type AppUser = {
    id : Nat;
    principal : Principal;
    username : Text;
    roles : [Nat];
    createdAt : Int;
    password : Text;
  };

  type AppRole = {
    id : Nat;
    name : Text;
    description : Text;
  };

  type Stage = {
    id : Nat;
    name : Text;
    orderIndex : Nat;
    assignedRoles : [Nat];
    sfaEnabled : Bool;
  };

  type OrderStage = {
    orderId : Nat;
    stageId : Nat;
    completed : Bool;
    completedAt : ?Int;
    completedBy : ?Principal;
    notes : Text;
    manualDate : ?Text;
  };

  type AuditEntry = {
    id : Nat;
    action : Text;
    entityType : Text;
    entityId : Text;
    performedBy : Principal;
    timestamp : Int;
    details : Text;
  };

  type Setting = {
    key : Text;
    value : Text;
    updatedAt : Int;
  };

  // State
  let orders = Map.empty<Nat, Order>();
  let users = Map.empty<Nat, AppUser>();
  let roles = Map.empty<Nat, AppRole>();
  let stages = Map.empty<Nat, Stage>();
  let orderStages = Map.empty<Nat, OrderStage>();
  let auditLog = Map.empty<Nat, AuditEntry>();
  let settings = Map.empty<Text, Setting>();

  // Seed default admin on init
  do {
    let adminUser : AppUser = {
      id = 1;
      principal = Principal.fromText("2vxsx-fae");
      username = "Arpit";
      roles = [1];
      createdAt = 0;
      password = "TyGoD@2127";
    };
    users.add(1, adminUser);
  };

  // User/Role Management
  public query ({ caller }) func listUsers() : async [AppUser] {
    users.values().toArray();
  };

  public shared ({ caller }) func assignRoles(userId : Nat, roleIds : [Nat]) : async () {
    switch (users.get(userId)) {
      case (?user) {
        let updatedUser = {
          id = user.id;
          principal = user.principal;
          username = user.username;
          roles = roleIds;
          createdAt = user.createdAt;
          password = user.password;
        };
        users.add(userId, updatedUser);
      };
      case (null) {};
    };
  };

  public shared ({ caller }) func deleteUser(userId : Nat) : async () {
    users.remove(userId);
  };

  public shared ({ caller }) func createRole(name : Text, description : Text) : async () {
    let roleId = roles.size() + 1;
    let role : AppRole = { id = roleId; name; description };
    roles.add(roleId, role);
  };

  public query func listRoles() : async [AppRole] {
    roles.values().toArray();
  };

  // Order Management
  public shared ({ caller }) func createOrder(
    orderId : Text,
    consumerNo : Text,
    contactNo : Text,
    customerName : Text,
    address : Text,
    orderDate : Text,
    expectedDelivery : Text,
    product : Text,
    quantity : Nat,
    amount : Float
  ) : async Nat {
    let newId = orders.size() + 1;
    let order : Order = {
      id = newId;
      orderId;
      consumerNo;
      contactNo;
      customerName;
      address;
      orderDate;
      expectedDelivery;
      product;
      quantity;
      amount;
      paymentStatus = "pending";
      paymentDate = "";
      collectDate = "";
      status = "active";
      notes = "";
      createdBy = caller;
      createdAt = Time.now();
      updatedAt = Time.now();
      isHeld = false;
      isAllClear = false;
    };
    orders.add(newId, order);
    newId;
  };

  public shared ({ caller }) func updateOrder(
    id : Nat,
    fields : {
      orderId : Text;
      consumerNo : Text;
      contactNo : Text;
      customerName : Text;
      address : Text;
      orderDate : Text;
      expectedDelivery : Text;
      product : Text;
      quantity : Nat;
      amount : Float;
      paymentStatus : Text;
      paymentDate : Text;
      collectDate : Text;
      status : Text;
      notes : Text;
    }
  ) : async () {
    switch (orders.get(id)) {
      case (?_) {
        let updatedOrder : Order = {
          id;
          orderId = fields.orderId;
          consumerNo = fields.consumerNo;
          contactNo = fields.contactNo;
          customerName = fields.customerName;
          address = fields.address;
          orderDate = fields.orderDate;
          expectedDelivery = fields.expectedDelivery;
          product = fields.product;
          quantity = fields.quantity;
          amount = fields.amount;
          paymentStatus = fields.paymentStatus;
          paymentDate = fields.paymentDate;
          collectDate = fields.collectDate;
          status = fields.status;
          notes = fields.notes;
          createdBy = caller;
          createdAt = Time.now();
          updatedAt = Time.now();
          isHeld = false;
          isAllClear = false;
        };
        orders.add(id, updatedOrder);
      };
      case (null) {};
    };
  };

  public query ({ caller }) func listOrders(page : Nat, pageSize : Nat) : async {
    orders : [Order];
    total : Nat;
  } {
    let ordersArray = orders.values().toArray();
    let total = ordersArray.size();
    let startIndex = if (page > 0) {
      ((page - 1) * pageSize).toInt().toNat();
    } else { 0 };
    let endIndex = if (startIndex + pageSize > total) {
      total;
    } else { startIndex + pageSize };
    let paginated = ordersArray.sliceToArray(startIndex, endIndex);
    { orders = paginated; total };
  };

  // Stage Management
  public shared ({ caller }) func createStage(name : Text, orderIndex : Nat, assignedRoles : [Nat], sfaEnabled : Bool) : async () {
    let stageId = stages.size() + 1;
    let stage : Stage = {
      id = stageId;
      name;
      orderIndex;
      assignedRoles;
      sfaEnabled;
    };
    stages.add(stageId, stage);
  };

  public query func listStages() : async [Stage] {
    stages.values().toArray();
  };

  public shared ({ caller }) func updateStage(id : Nat, fields : { name : Text; orderIndex : Nat; assignedRoles : [Nat]; sfaEnabled : Bool }) : async () {
    switch (stages.get(id)) {
      case (?_) {
        let updatedStage = {
          id;
          name = fields.name;
          orderIndex = fields.orderIndex;
          assignedRoles = fields.assignedRoles;
          sfaEnabled = fields.sfaEnabled;
        };
        stages.add(id, updatedStage);
      };
      case (null) {};
    };
  };

  // Audit & Settings Management
  public shared ({ caller }) func appendAudit(action : Text, entityType : Text, entityId : Text, details : Text) : async () {
    let auditId = auditLog.size() + 1;
    let entry : AuditEntry = {
      id = auditId;
      action;
      entityType;
      entityId;
      performedBy = caller;
      timestamp = Time.now();
      details;
    };
    auditLog.add(auditId, entry);
  };

  public query ({ caller }) func listAuditLog(limit : Nat, filterEntity : Text) : async [AuditEntry] {
    var entries = List.empty<AuditEntry>();
    for (entry in auditLog.values()) {
      if (entries.size() < limit) {
        if (filterEntity.size() == 0 or entry.entityType == filterEntity) {
          entries.add(entry);
        };
      } else { return entries.toArray() };
    };
    entries.toArray();
  };

  public shared ({ caller }) func setSetting(key : Text, value : Text) : async () {
    let setting : Setting = {
      key;
      value;
      updatedAt = Time.now();
    };
    settings.add(key, setting);
  };

  public query ({ caller }) func getSetting(key : Text) : async ?Text {
    switch (settings.get(key)) {
      case (?setting) { ?setting.value };
      case (null) { null };
    };
  };

  // Hold & All-Clear flags
  public shared ({ caller }) func setHoldFlag(orderId : Nat, flag : Bool) : async () {
    switch (orders.get(orderId)) {
      case (?order) {
        let updatedOrder = { order with isHeld = flag };
        orders.add(orderId, updatedOrder);
      };
      case (null) {};
    };
  };

  public shared ({ caller }) func setAllClearFlag(orderId : Nat, flag : Bool) : async () {
    switch (orders.get(orderId)) {
      case (?order) {
        let updatedOrder = { order with isAllClear = flag };
        orders.add(orderId, updatedOrder);
      };
      case (null) {};
    };
  };

  // Password-based auth
  public shared ({ caller }) func registerWithPassword(username : Text, password : Text) : async Nat {
    let userId = users.size() + 1;
    let userRoles : [Nat] = [];
    let user : AppUser = {
      id = userId;
      principal = caller;
      username;
      roles = userRoles;
      createdAt = Time.now();
      password;
    };
    users.add(userId, user);
    userId;
  };

  public shared ({ caller }) func loginWithPassword(username : Text, password : Text) : async ?AppUser {
    let iter = users.values();
    switch (iter.find(func(u : AppUser) : Bool { u.username == username and u.password == password })) {
      case (?user) { ?user };
      case (null) { null };
    };
  };

  // Legacy compatibility
  public shared ({ caller }) func registerSelf(username : Text) : async Nat {
    let userId = users.size() + 1;
    let userRoles : [Nat] = [];
    let user : AppUser = {
      id = userId;
      principal = caller;
      username;
      roles = userRoles;
      createdAt = Time.now();
      password = "";
    };
    users.add(userId, user);
    userId;
  };

  public query ({ caller }) func getCurrentUser() : async ?AppUser {
    let iter = users.values();
    let user = iter.find(
      func(_user : AppUser) : Bool {
        _user.principal.equal(caller);
      }
    );
    user;
  };
};
