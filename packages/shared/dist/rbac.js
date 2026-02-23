export const roleKeys = ['Owner', 'Manager', 'Technician'];
export const privilegeKeys = [
    'tickets.read',
    'tickets.write',
    'tickets.assign',
    'tickets.status.update',
    'dispatch.manage',
    'users.read',
    'users.manage',
    'locations.read',
    'locations.manage',
    'comments.read',
    'comments.write',
    'attachments.read',
    'attachments.write',
    'payments.read',
    'payments.write',
    'billing.manage',
    'sync.run'
];
const allPrivileges = [...privilegeKeys];
export const rolePrivileges = {
    Owner: allPrivileges,
    Manager: [
        'tickets.read',
        'tickets.write',
        'tickets.assign',
        'tickets.status.update',
        'dispatch.manage',
        'users.read',
        'users.manage',
        'locations.read',
        'comments.read',
        'comments.write',
        'attachments.read',
        'attachments.write',
        'payments.read',
        'sync.run'
    ],
    Technician: [
        'tickets.read',
        'tickets.status.update',
        'comments.read',
        'comments.write',
        'attachments.read',
        'attachments.write',
        'sync.run'
    ]
};
//# sourceMappingURL=rbac.js.map