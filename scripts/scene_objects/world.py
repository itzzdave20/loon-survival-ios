
""" WorldRenderer """
import scripts.bases.multi_rect_bases.wall
Wall = scripts.bases.multi_rect_bases.wall.Wall

_HIDE=False


class World(Wall):
	def __init__(self, game, hide=_HIDE):
		super().__init__(game, window=None, hide=hide)
								
	def re_init(self, hide=_HIDE):
		super().re_init(hide=hide)
