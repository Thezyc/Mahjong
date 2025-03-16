from PIL import Image
import os

# 配置参数
background_path = "./MiaojiangTexture/miaojiang_bai.png"  # 材质背景路径
tiles_folder = "./MahjongTiles"        # 数牌文件夹路径
output_folder = "output/"              # 输出目录
scale_factor = 0.63                    # 数牌缩放比例（相对于背景）

# 新增偏移量参数
offset_x = -10  # 负数左移，正数右移
offset_y = 15   # 负数上移，正数下移

def combine_tiles():
    # 创建输出目录
    os.makedirs(output_folder, exist_ok=True)
    
    # 加载背景图片
    bg = Image.open(background_path)
    
    # 遍历数牌目录
    for filename in os.listdir(tiles_folder):
        if filename.lower().endswith(('.png')):
            try:
                # 加载数牌并保持透明通道
                tile = Image.open(os.path.join(tiles_folder, filename)).convert("RGBA")
                
                # 计算缩放尺寸
                new_width = int(bg.width * scale_factor)
                new_height = int(bg.height * scale_factor)
                tile = tile.resize((new_width, new_height), Image.LANCZOS)
                
                # 计算居中位置
                position = (
                    (bg.width - tile.width) // 2 + offset_x,
                    (bg.height - tile.height) // 2 + offset_y
                )
                
                # 创建副本并合成
                combined = bg.copy()
                combined.paste(tile, position, tile)  # 保持透明叠加
                
                # 保存结果
                output_path = os.path.join(output_folder, f"combined_{filename}")
                combined.save(output_path)
                print(f"已生成：{output_path}")
                
            except Exception as e:
                print(f"处理 {filename} 时出错：{str(e)}")

if __name__ == "__main__":
    combine_tiles()