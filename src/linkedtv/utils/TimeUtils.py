
class TimeUtils():
    
    @staticmethod
    def toStringSeconds(ms):
        ms = int(ms)
        s = 0
        while ms - 1000 >= 0:
            s += 1
            ms -= 1000
        if ms > 0:
            return '%d.%d' % (s, ms)
        return '%d' % s
        