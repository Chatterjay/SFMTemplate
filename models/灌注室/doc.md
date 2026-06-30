# 灌注室代码

## SFM 代码
```sfm
every 60 ticks do
	input from "1"
	output to  each  "2"
	forget
	input from "2"
	output except "minecraft:lapis_lazuli" to "3"
end
```
![SFM 编程界面](images/灌注室_SFM设置.png)

## 样板供应器设置
- 阻挡模式：off
- 锁定合成：off
