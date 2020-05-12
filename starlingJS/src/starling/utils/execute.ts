module StarlingJS {
    export function execute(func: Function, ...args): void
        {
            if(func != null)
    {
        var i: number;
        var maxNumArgs: number = func.length;

        for (i = args.length; i < maxNumArgs; ++i)
            args[i] = null;

        // In theory, the 'default' case would always work,
        // but we want to avoid the 'slice' allocations.

        switch (maxNumArgs) {
            case 0: func(); break;
            case 1: func(args[0]); break;
            case 2: func(args[0], args[1]); break;
            case 3: func(args[0], args[1], args[2]); break;
            case 4: func(args[0], args[1], args[2], args[3]); break;
            case 5: func(args[0], args[1], args[2], args[3], args[4]); break;
            case 6: func(args[0], args[1], args[2], args[3], args[4], args[5]); break;
            case 7: func(args[0], args[1], args[2], args[3], args[4], args[5], args[6]); break;
            default: func.apply(null, args.slice(0, maxNumArgs)); break;
        }
    }
}
}