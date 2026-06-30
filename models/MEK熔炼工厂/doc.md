# MEK熔炼工厂代码

## SFM 代码
```sfm
every ticks do
    input fe:: from "1" top side
    output fe:: to "2" top side
    end
every 20 ticks do
    input from "3"
    output retain 256 to each "2" top side
    forget
    input from "2" top side
    output to "4" top side
end
```

## 样板供应器设置
- 阻挡模式：off
- 锁定合成：off

## 终极熔炼工厂
- 上:输入/输出
- 其余:空
- 自动弹出:off